// LIFE OS — брелок-кнопка: нажал, наговорил, мысль в дневнике.
//
// Плата: Seeed XIAO ESP32-S3 Sense (микрофон и слот microSD уже на плате).
// Кнопка: между выводом D0 и GND.
// Светодиод (не обязательно): между D1 и GND через резистор 220 Ом.
//
// Как работает:
//   • Брелок спит (несколько недель на одном заряде).
//   • Держишь кнопку — пишет голос. Отпустил — запись закончилась.
//   • Есть домашний Wi-Fi — сразу отправляет в LIFE OS.
//   • Нет Wi-Fi (ты на велике) — кладёт запись на карту памяти и отправит
//     дома. В дневник она ляжет тем временем, когда ты её наговорил.
//
// Первая настройка: держи кнопку и воткни USB. Брелок поднимет свою
// Wi-Fi-сеть «LIFE OS setup» — подключись к ней телефоном, откроется
// страница, там впиши домашний Wi-Fi и вставь ссылку устройства
// (Профиль → Мои устройства → Добавить брелок).

#include "ESP_I2S.h"
#include "FS.h"
#include "SD.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WebServer.h>
#include <time.h>

// ─── Железо ──────────────────────────────────────────────────────────────
#define BTN_PIN        D0        // кнопка на землю (внутренняя подтяжка вверх)
#define BTN_GPIO       GPIO_NUM_1 // тот же вывод номером — для пробуждения из сна
#define LED_PIN        D1        // светодиод; поставь -1, если его нет
#define SD_CS_PIN      21        // карта памяти на плате Sense
#define MIC_CLK_PIN    42        // микрофон на плате Sense
#define MIC_DATA_PIN   41

// ─── Запись ──────────────────────────────────────────────────────────────
#define SAMPLE_RATE    16000     // 16 кГц моно — речь, экономно по месту
#define MAX_SECONDS    120       // предохранитель от зажатой в кармане кнопки
#define MIN_MS         400       // короче — считаем случайным нажатием
#define QUEUE_DIR      "/q"      // очередь записей, ждущих Wi-Fi

// ─── Настройка ───────────────────────────────────────────────────────────
#define AP_NAME        "LIFE OS setup"
#define WIFI_TIMEOUT_MS 12000

I2SClass i2s;
Preferences prefs;
WebServer server(80);

// Часы переживают глубокий сон, но при первом включении времени ещё нет.
RTC_DATA_ATTR bool clockKnown = false;

String cfgSsid, cfgPass, cfgUrl;
bool hasSD = false;

// ─────────────────────────────────────────────────────────────────────────
// Светодиод: единственная обратная связь, поэтому мигаем осмысленно.
// ─────────────────────────────────────────────────────────────────────────
void led(bool on) {
  if (LED_PIN >= 0) digitalWrite(LED_PIN, on ? HIGH : LOW);
}

void blink(int times, int ms) {
  for (int i = 0; i < times; i++) { led(true); delay(ms); led(false); delay(ms); }
}

// ─────────────────────────────────────────────────────────────────────────
// Заголовок WAV: 44 байта перед звуковыми данными, иначе файл не прочитают.
// ─────────────────────────────────────────────────────────────────────────
void writeWavHeader(uint8_t *h, uint32_t dataLen) {
  uint32_t byteRate = SAMPLE_RATE * 2;
  uint32_t chunk = dataLen + 36;
  memcpy(h, "RIFF", 4);
  memcpy(h + 4, &chunk, 4);
  memcpy(h + 8, "WAVEfmt ", 8);
  uint32_t sub1 = 16; uint16_t fmt = 1, ch = 1, align = 2, bits = 16;
  uint32_t rate = SAMPLE_RATE;
  memcpy(h + 16, &sub1, 4);
  memcpy(h + 20, &fmt, 2);
  memcpy(h + 22, &ch, 2);
  memcpy(h + 24, &rate, 4);
  memcpy(h + 28, &byteRate, 4);
  memcpy(h + 32, &align, 2);
  memcpy(h + 34, &bits, 2);
  memcpy(h + 36, "data", 4);
  memcpy(h + 40, &dataLen, 4);
}

// ─────────────────────────────────────────────────────────────────────────
// Пишем голос, пока кнопка нажата. Возвращаем готовый WAV в памяти.
// ─────────────────────────────────────────────────────────────────────────
uint8_t *recordWhileHeld(size_t *outLen) {
  const size_t maxData = (size_t)SAMPLE_RATE * 2 * MAX_SECONDS;
  uint8_t *buf = (uint8_t *)ps_malloc(maxData + 44);
  if (!buf) return nullptr;

  i2s.setPinsPdmRx(MIC_CLK_PIN, MIC_DATA_PIN);
  if (!i2s.begin(I2S_MODE_PDM_RX, SAMPLE_RATE, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_MONO)) {
    free(buf);
    return nullptr;
  }

  led(true);
  size_t got = 0;
  uint32_t started = millis();
  while (digitalRead(BTN_PIN) == LOW && got < maxData) {
    size_t n = i2s.readBytes((char *)(buf + 44 + got), 4096);
    if (n == 0) break;
    got += n;
  }
  led(false);
  i2s.end();

  // Слишком короткое нажатие — это карман, а не мысль.
  if (millis() - started < MIN_MS || got < SAMPLE_RATE) { free(buf); return nullptr; }

  writeWavHeader(buf, got);
  *outLen = got + 44;
  return buf;
}

// ─────────────────────────────────────────────────────────────────────────
// Wi-Fi и время. Время нужно, чтобы отложенная запись легла в дневник
// тем часом, когда ты говорил, а не когда брелок доехал до дома.
// ─────────────────────────────────────────────────────────────────────────
bool connectWifi() {
  if (cfgSsid.isEmpty()) return false;
  WiFi.mode(WIFI_STA);
  WiFi.begin(cfgSsid.c_str(), cfgPass.c_str());
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < WIFI_TIMEOUT_MS) delay(200);
  if (WiFi.status() != WL_CONNECTED) return false;

  if (!clockKnown) {
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    uint32_t t1 = millis();
    while (time(nullptr) < 1700000000 && millis() - t1 < 8000) delay(200);
    if (time(nullptr) > 1700000000) clockKnown = true;
  }
  return true;
}

time_t nowEpoch() {
  time_t t = time(nullptr);
  return (clockKnown && t > 1700000000) ? t : 0; // 0 — сервер поставит своё время
}

// ─────────────────────────────────────────────────────────────────────────
// Отправка в LIFE OS: тот же вход, что у часов и приложения.
// ─────────────────────────────────────────────────────────────────────────
bool upload(uint8_t *wav, size_t len, time_t at) {
  if (cfgUrl.isEmpty()) return false;
  String url = cfgUrl;
  if (at > 0) url += (url.indexOf('?') >= 0 ? "&at=" : "?at=") + String((uint32_t)at);

  HTTPClient http;
  http.setTimeout(30000);
  if (!http.begin(url)) return false;
  http.addHeader("Content-Type", "audio/wav");
  int code = http.POST(wav, len);
  http.end();
  return code == 200;
}

// ─────────────────────────────────────────────────────────────────────────
// Очередь на карте: то, что записалось без интернета.
// Имя файла — момент записи, поэтому время не теряется.
// ─────────────────────────────────────────────────────────────────────────
void saveToQueue(uint8_t *wav, size_t len, time_t at) {
  if (!hasSD) return;
  if (!SD.exists(QUEUE_DIR)) SD.mkdir(QUEUE_DIR);
  String path = String(QUEUE_DIR) + "/" + String((uint32_t)at) + ".wav";
  File f = SD.open(path, FILE_WRITE);
  if (!f) return;
  f.write(wav, len);
  f.close();
}

void flushQueue() {
  if (!hasSD) return;
  File dir = SD.open(QUEUE_DIR);
  if (!dir) return;

  while (true) {
    File f = dir.openNextFile();
    if (!f) break;
    if (f.isDirectory()) { f.close(); continue; }

    String path = String(f.path());
    size_t len = f.size();
    uint8_t *buf = (uint8_t *)ps_malloc(len);
    if (!buf) { f.close(); break; }
    f.read(buf, len);
    f.close();

    // Момент записи зашит в имя файла: /q/1753790400.wav
    String base = path.substring(path.lastIndexOf('/') + 1);
    time_t at = (time_t)base.toInt();

    bool ok = upload(buf, len, at);
    free(buf);
    if (ok) SD.remove(path); else break; // не получилось — остальные тоже подождут
  }
  dir.close();
}

// ─────────────────────────────────────────────────────────────────────────
// Первая настройка: брелок сам раздаёт Wi-Fi со страничкой-формой.
// ─────────────────────────────────────────────────────────────────────────
const char *FORM_HTML =
  "<!doctype html><meta charset=utf-8>"
  "<meta name=viewport content='width=device-width,initial-scale=1'>"
  "<style>body{font:16px -apple-system,sans-serif;max-width:420px;margin:40px auto;padding:0 18px}"
  "h1{font-size:20px}label{display:block;margin:16px 0 6px;font-size:14px;color:#555}"
  "input{width:100%;padding:12px;font-size:16px;border:1px solid #ccc;border-radius:9px;box-sizing:border-box}"
  "button{margin-top:22px;width:100%;padding:14px;font-size:16px;font-weight:600;"
  "background:#6366f1;color:#fff;border:0;border-radius:10px}</style>"
  "<h1>Брелок LIFE OS</h1>"
  "<form method=POST action=/save>"
  "<label>Домашний Wi-Fi (название сети)</label><input name=ssid>"
  "<label>Пароль от Wi-Fi</label><input name=pass type=password>"
  "<label>Ссылка устройства<br><small>Профиль &rarr; Мои устройства &rarr; Добавить брелок</small></label>"
  "<input name=url placeholder='https://life-os.today/api/device/voice?token=...'>"
  "<button>Сохранить</button></form>";

void configPortal() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_NAME);

  server.on("/", []() { server.send(200, "text/html; charset=utf-8", FORM_HTML); });
  server.on("/save", HTTP_POST, []() {
    prefs.putString("ssid", server.arg("ssid"));
    prefs.putString("pass", server.arg("pass"));
    prefs.putString("url", server.arg("url"));
    server.send(200, "text/html; charset=utf-8",
      "<meta charset=utf-8><body style='font:16px -apple-system;padding:40px'>"
      "Готово. Отключи USB — брелок можно носить.");
    delay(1200);
    ESP.restart();
  });
  // Телефон сам откроет форму: любой адрес ведёт на неё.
  server.onNotFound([]() { server.send(200, "text/html; charset=utf-8", FORM_HTML); });
  server.begin();

  while (true) { server.handleClient(); blink(1, 600); }
}

// ─────────────────────────────────────────────────────────────────────────
void sleepNow() {
  led(false);
  esp_sleep_enable_ext0_wakeup(BTN_GPIO, 0); // проснуться, когда кнопку нажали
  esp_deep_sleep_start();
}

void setup() {
  pinMode(BTN_PIN, INPUT_PULLUP);
  if (LED_PIN >= 0) pinMode(LED_PIN, OUTPUT);
  prefs.begin("lifeos", false);

  cfgSsid = prefs.getString("ssid", "");
  cfgPass = prefs.getString("pass", "");
  cfgUrl  = prefs.getString("url", "");

  // Кнопка зажата при включении (или ещё ничего не настроено) — форма настройки.
  bool held = digitalRead(BTN_PIN) == LOW;
  bool woken = esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_EXT0;
  if (cfgUrl.isEmpty() || (held && !woken)) configPortal();

  hasSD = SD.begin(SD_CS_PIN);

  size_t len = 0;
  uint8_t *wav = recordWhileHeld(&len);
  if (!wav) { blink(2, 80); sleepNow(); }   // пусто — просто спим дальше

  bool online = connectWifi();
  time_t at = nowEpoch();

  if (online) {
    flushQueue();                            // сначала разгребаем старое
    if (upload(wav, len, at)) blink(2, 120); // ушло
    else { saveToQueue(wav, len, at); blink(3, 300); }
  } else {
    saveToQueue(wav, len, at);               // дома отправим
    blink(1, 500);
  }

  free(wav);
  WiFi.disconnect(true);
  sleepNow();
}

void loop() { /* вся жизнь брелка — в setup(), между нажатиями он спит */ }
