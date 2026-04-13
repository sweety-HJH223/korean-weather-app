const apiKey = '04177e3c64ac4a2a81260029260804';
let clockInterval;

// --- SOUNDS ---
const sounds = {
  click: new Audio('assets/sound/click.mp3'),
  hover: new Audio('assets/sound/chime.mp3'),
  night: new Audio('assets/sound/night.mp3'),
  rain: new Audio('assets/sound/rain.mp3'),
  sunny: new Audio('assets/sound/sunny.mp3'),
  winter: new Audio('assets/sound/winter.mp3'),
};
sounds.night.loop = true;
sounds.rain.loop = true;
sounds.sunny.loop = true;
sounds.winter.loop = true;

let currentAmbient = null;
let isMuted = true;

function playAmbient(name) {
  if (currentAmbient && currentAmbient === sounds[name] && !currentAmbient.paused) return;
  if (currentAmbient) { currentAmbient.pause(); currentAmbient.currentTime = 0; currentAmbient.volume = 0.3; }
  currentAmbient = sounds[name];
  currentAmbient.volume = 0.3;
  if (!isMuted) currentAmbient.play().catch(e => console.log('Audio blocked:', e));
}
function playHover() {
  if (isMuted) return;
  sounds.hover.currentTime = 0;
  sounds.hover.volume = 0.8;
  sounds.hover.play().catch(() => {});
}

window.addEventListener('load', () => {
  const btn = document.getElementById('soundBtn');
  if (!btn) return;
  btn.onclick = () => {
    isMuted = !isMuted;
    btn.innerText = isMuted ? '🔇' : '🔊';
    if (isMuted) {
      if (currentAmbient) { currentAmbient.pause(); currentAmbient.currentTime = 0; }
    } else {
      sounds.click.currentTime = 0;
      sounds.click.play().catch(() => {});
      if (currentAmbient) currentAmbient.play().catch(e => console.log(e));
    }
  };
});

// --- UTILITIES ---
function showHistory() {
  const saved = localStorage.getItem('lastVibe');
  if (saved) {
    const data = JSON.parse(saved);
    const lastCityLabel = document.getElementById('lastCity');
    if (lastCityLabel) lastCityLabel.innerText = `${data.city} (${data.temp})`;
    document.getElementById('prevSearch').classList.remove('hidden');
  }
}

function updateLiveClock(tzId, currentTemp = null) {
  const tick = () => {
    const now = new Date();
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: tzId }));
    const hours = localTime.getHours();
    const mins = localTime.getMinutes().toString().padStart(2, '0');
    let greeting = hours < 12 ? "좋은 아침이에요 ☕" : hours < 17 ? "편안한 오후 보내고 있나요 ☀️" : "오늘 하루도 수고했어요 🌙";
    if (currentTemp !== null) {
      if (currentTemp > 28) greeting = "많이 더워요 시원하게 쉬어가요 🧊";
      else if (currentTemp < 10) greeting = "쌀쌀해요 따뜻하게 챙겨요 🧣";
    }
    const greetingEl = document.getElementById('greeting');
    const clockEl = document.getElementById('liveClock');
    if (greetingEl) greetingEl.innerText = greeting;
    if (clockEl) clockEl.innerText = `${hours.toString().padStart(2, '0')}:${mins}`;
  };
  tick();
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(tick, 1000);
}

function updateDynamicBackground(hour) {
  const video = document.getElementById('bgVideo');
  const overlay = document.querySelector('.overlay-glow');
  if (!video) return;
  let videoSrc = "assets/images/night.mp4";
  let glow = "radial-gradient(circle, transparent, rgba(0,0,0,0.7))";
  if (hour >= 5 && hour < 11) { videoSrc = "assets/images/morning.mp4"; glow = "radial-gradient(circle, rgba(255,223,0,0.1), rgba(0,0,0,0.4))"; }
  else if (hour >= 11 && hour < 17) { videoSrc = "assets/images/afternoon.mp4"; glow = "radial-gradient(circle, rgba(255,255,255,0.05), rgba(0,0,0,0.4))"; }
  else if (hour >= 17 && hour < 20) { videoSrc = "assets/images/evening.mp4"; glow = "radial-gradient(circle, rgba(255,69,0,0.15), rgba(0,0,0,0.5))"; }
  if (!video.src.includes(videoSrc)) {
    video.src = videoSrc;
    if (overlay) overlay.style.background = glow;
    video.load();
    video.play().catch(e => console.log("Video play error:", e));
  }
}

// ============================================================
// WMO WEATHER CODE MAPPINGS (for Open-Meteo / KMA)
// ============================================================
function wmoToKorean(code) {
  const map = {
    0: "맑음", 1: "대체로 맑음", 2: "구름 조금", 3: "흐림",
    45: "안개", 48: "결빙 안개",
    51: "가벼운 이슬비", 53: "이슬비", 55: "강한 이슬비",
    56: "가벼운 결빙 이슬비", 57: "강한 결빙 이슬비",
    61: "가벼운 비", 63: "보통 비", 65: "강한 비",
    66: "가벼운 결빙 비", 67: "강한 결빙 비",
    71: "가벼운 눈", 73: "보통 눈", 75: "강한 눈",
    77: "우박",
    80: "소나기", 81: "보통 소나기", 82: "폭우",
    85: "가벼운 눈 소나기", 86: "강한 눈 소나기",
    95: "천둥번개", 96: "천둥 동반 약한 우박", 99: "천둥 동반 강한 우박",
  };
  return map[code] || "알 수 없음";
}

function wmoToGif(code, isDay) {
  if (code === 95 || code === 96 || code === 99) return "Strom.gif";
  if (code === 75 || code === 86) return "blizzard.png";
  if (code >= 71 && code <= 77) return "snow.png";
  if (code === 85) return "snow.png";
  if (code >= 61 && code <= 67) return isDay ? "rain day.png" : "rain.png";
  if (code >= 80 && code <= 82) return isDay ? "rain day.png" : "rain.png";
  if (code >= 51 && code <= 57) return isDay ? "rain day.png" : "rain.png";
  if (code === 45 || code === 48) return "fog.png";
  if (code === 3) return "Cloudy_overcast.png";
  if (code === 2) return isDay ? "cloudy day.png" : "cloudy night.png";
  if (code === 1) return isDay ? "cloudy day.png" : "cloudy night.png";
  return isDay ? "sunny.png" : "moon.gif";
}

function wmoIsRain(code) { return (code >= 51 && code <= 67) || (code >= 80 && code <= 82); }
function wmoIsSnow(code) { return (code >= 71 && code <= 77) || code === 85 || code === 86; }
function wmoIsThunder(code) { return code === 95 || code === 96 || code === 99; }
function wmoIsFog(code) { return code === 45 || code === 48; }
function wmoIsCloudy(code) { return code === 1 || code === 2 || code === 3; }

// Moon phase calculation (based on date)
function getMoonPhase(date) {
  const knownNew = new Date(2000, 0, 6, 18, 14);
  const lunarCycle = 29.530588853;
  const diff = (date - knownNew) / (1000 * 60 * 60 * 24);
  const phase = ((diff % lunarCycle) + lunarCycle) % lunarCycle;
  const moonMap = [
    { max: 1.85, emoji: "🌑", korean: "신월" },
    { max: 7.38, emoji: "🌒", korean: "초승달" },
    { max: 11.07, emoji: "🌓", korean: "상현달" },
    { max: 14.77, emoji: "🌔", korean: "차오르는 달" },
    { max: 16.61, emoji: "🌕", korean: "보름달" },
    { max: 22.15, emoji: "🌖", korean: "기우는 달" },
    { max: 25.84, emoji: "🌗", korean: "하현달" },
    { max: 29.53, emoji: "🌘", korean: "그믐달" },
  ];
  return moonMap.find(m => phase < m.max) || moonMap[0];
}

// ============================================================
// KOREAN CITY COORDINATE MAP
// ============================================================
const koreanCityCoords = {
  "서울": "37.5665,126.9780", "서울시": "37.5665,126.9780",
  "강남": "37.5172,127.0473", "강남구": "37.5172,127.0473",
  "강북": "37.6396,127.0255", "강북구": "37.6396,127.0255",
  "강서구": "37.5509,126.8495", "강동구": "37.5301,127.1238",
  "관악구": "37.4784,126.9516", "광진구": "37.5385,127.0823",
  "구로구": "37.4955,126.8877", "금천구": "37.4604,126.9002",
  "노원구": "37.6543,127.0568", "도봉구": "37.6688,127.0472",
  "동대문구": "37.5744,127.0395", "동작구": "37.5124,126.9393",
  "마포구": "37.5638,126.9084", "서대문구": "37.5791,126.9368",
  "서초구": "37.4837,127.0324", "성동구": "37.5633,127.0368",
  "성북구": "37.5894,127.0167", "송파구": "37.5145,127.1059",
  "양천구": "37.5270,126.8563", "영등포구": "37.5262,126.8963",
  "용산구": "37.5324,126.9901", "은평구": "37.6027,126.9291",
  "종로구": "37.5730,126.9794", "중구": "37.5641,126.9979",
  "중랑구": "37.6063,127.0927",
  "수원": "37.2636,127.0286", "수원시": "37.2636,127.0286",
  "성남": "37.4449,127.1388", "성남시": "37.4449,127.1388",
  "분당": "37.3825,127.1175",
  "고양": "37.6583,126.8320", "고양시": "37.6583,126.8320",
  "일산": "37.7219,126.7153",
  "용인": "37.2411,127.1776", "용인시": "37.2411,127.1776",
  "부천": "37.5034,126.7660", "부천시": "37.5034,126.7660",
  "안산": "37.3219,126.8309", "안산시": "37.3219,126.8309",
  "안양": "37.3943,126.9568", "안양시": "37.3943,126.9568",
  "남양주": "37.6360,127.2165", "남양주시": "37.6360,127.2165",
  "화성": "37.1994,126.8316", "화성시": "37.1994,126.8316",
  "평택": "36.9921,127.1130", "평택시": "36.9921,127.1130",
  "시흥": "37.3800,126.8031", "시흥시": "37.3800,126.8031",
  "파주": "37.8601,126.7874", "파주시": "37.8601,126.7874",
  "의정부": "37.7381,127.0438", "의정부시": "37.7381,127.0438",
  "김포": "37.6154,126.7158", "김포시": "37.6154,126.7158",
  "광주": "37.4294,127.2550", "광주시": "37.4294,127.2550",
  "하남": "37.5395,127.2148", "하남시": "37.5395,127.2148",
  "광명": "37.4784,126.8647", "광명시": "37.4784,126.8647",
  "군포": "37.3612,126.9352", "군포시": "37.3612,126.9352",
  "오산": "37.1499,127.0772", "오산시": "37.1499,127.0772",
  "이천": "37.2724,127.4348", "이천시": "37.2724,127.4348",
  "양주": "37.7853,127.0458", "양주시": "37.7853,127.0458",
  "구리": "37.5943,127.1295", "구리시": "37.5943,127.1295",
  "안성": "37.0079,127.2798", "안성시": "37.0079,127.2798",
  "포천": "37.8948,127.2002", "포천시": "37.8948,127.2002",
  "의왕": "37.3448,126.9686", "의왕시": "37.3448,126.9686",
  "여주": "37.2982,127.6378", "여주시": "37.2982,127.6378",
  "동두천": "37.9036,127.0607", "동두천시": "37.9036,127.0607",
  "과천": "37.4292,126.9876", "과천시": "37.4292,126.9876",
  "가평": "37.8316,127.5111", "가평군": "37.8316,127.5111",
  "양평": "37.4916,127.4875", "양평군": "37.4916,127.4875",
  "연천": "38.0967,127.0747", "연천군": "38.0967,127.0747",
  "인천": "37.4563,126.7052", "인천시": "37.4563,126.7052",
  "부평구": "37.5077,126.7218", "계양구": "37.5375,126.7378",
  "남동구": "37.4469,126.7314", "연수구": "37.4104,126.6780",
  "미추홀구": "37.4638,126.6503",
  "강화": "37.7474,126.4875", "강화군": "37.7474,126.4875",
  "옹진군": "37.4461,126.3678",
  "부산": "35.1796,129.0756", "부산시": "35.1796,129.0756",
  "해운대": "35.1628,129.1636", "해운대구": "35.1628,129.1636",
  "수영구": "35.1452,129.1133",
  "금정구": "35.2430,129.0909", "기장군": "35.2445,129.2225",
  "동래구": "35.2051,129.0861", "부산진구": "35.1628,129.0531",
  "사상구": "35.1526,128.9924", "사하구": "35.1045,128.9742",
  "연제구": "35.1760,129.0793", "영도구": "35.0893,129.0680",
  "대구": "35.8714,128.6014", "대구시": "35.8714,128.6014",
  "달서구": "35.8299,128.5328", "달성군": "35.7746,128.4312",
  "수성구": "35.8580,128.6300",
  "광주광역시": "35.1595,126.8526", "광주 광역시": "35.1595,126.8526",
  "광산구": "35.1396,126.7937",
  "대전": "36.3504,127.3845", "대전시": "36.3504,127.3845",
  "유성구": "36.3624,127.3564",
  "울산": "35.5384,129.3114", "울산시": "35.5384,129.3114",
  "울주군": "35.5226,129.1595",
  "세종": "36.4800,127.2890", "세종시": "36.4800,127.2890",
  "춘천": "37.8813,127.7298", "춘천시": "37.8813,127.7298",
  "원주": "37.3422,127.9202", "원주시": "37.3422,127.9202",
  "강릉": "37.7519,128.8761", "강릉시": "37.7519,128.8761",
  "동해": "37.5245,129.1144", "동해시": "37.5245,129.1144",
  "태백": "37.1641,128.9857", "태백시": "37.1641,128.9857",
  "속초": "38.2070,128.5912", "속초시": "38.2070,128.5912",
  "삼척": "37.4497,129.1658", "삼척시": "37.4497,129.1658",
  "홍천": "37.6979,127.8889", "홍천군": "37.6979,127.8889",
  "횡성": "37.4917,127.9848", "횡성군": "37.4917,127.9848",
  "영월": "37.1837,128.4618", "영월군": "37.1837,128.4618",
  "평창": "37.3706,128.3910", "평창군": "37.3706,128.3910",
  "정선": "37.3801,128.6606", "정선군": "37.3801,128.6606",
  "철원": "38.1462,127.3130", "철원군": "38.1462,127.3130",
  "화천": "38.1064,127.7082", "화천군": "38.1064,127.7082",
  "양구": "38.1054,127.9898", "양구군": "38.1054,127.9898",
  "인제": "38.0702,128.1703", "인제군": "38.0702,128.1703",
  "양양": "38.0757,128.6188", "양양군": "38.0757,128.6188",
  "청주": "36.6424,127.4890", "청주시": "36.6424,127.4890",
  "충주": "36.9910,127.9259", "충주시": "36.9910,127.9259",
  "제천": "37.1324,128.1911", "제천시": "37.1324,128.1911",
  "보은": "36.4893,127.7298", "보은군": "36.4893,127.7298",
  "옥천": "36.3062,127.5718", "옥천군": "36.3062,127.5718",
  "영동": "36.1748,127.7758", "영동군": "36.1748,127.7758",
  "증평": "36.7854,127.5826", "증평군": "36.7854,127.5826",
  "진천": "36.8559,127.4348", "진천군": "36.8559,127.4348",
  "괴산": "36.8148,127.7863", "괴산군": "36.8148,127.7863",
  "음성": "36.9401,127.6894", "음성군": "36.9401,127.6894",
  "단양": "36.9848,128.3656", "단양군": "36.9848,128.3656",
  "천안": "36.8151,127.1139", "천안시": "36.8151,127.1139",
  "공주": "36.4468,127.1191", "공주시": "36.4468,127.1191",
  "보령": "36.3335,126.6127", "보령시": "36.3335,126.6127",
  "아산": "36.7898,127.0022", "아산시": "36.7898,127.0022",
  "서산": "36.7845,126.4503", "서산시": "36.7845,126.4503",
  "논산": "36.1868,127.0987", "논산시": "36.1868,127.0987",
  "계룡": "36.2742,127.2488", "계룡시": "36.2742,127.2488",
  "당진": "36.8934,126.6449", "당진시": "36.8934,126.6449",
  "금산": "36.1094,127.4881", "금산군": "36.1094,127.4881",
  "부여": "36.2754,126.9098", "부여군": "36.2754,126.9098",
  "서천": "36.0813,126.6915", "서천군": "36.0813,126.6915",
  "청양": "36.4597,126.8022", "청양군": "36.4597,126.8022",
  "홍성": "36.6013,126.6609", "홍성군": "36.6013,126.6609",
  "예산": "36.6803,126.8479", "예산군": "36.6803,126.8479",
  "태안": "36.7454,126.2978", "태안군": "36.7454,126.2978",
  "전주": "35.8242,127.1479", "전주시": "35.8242,127.1479",
  "군산": "35.9676,126.7368", "군산시": "35.9676,126.7368",
  "익산": "35.9483,126.9578", "익산시": "35.9483,126.9578",
  "정읍": "35.5698,126.8560", "정읍시": "35.5698,126.8560",
  "남원": "35.4164,127.3900", "남원시": "35.4164,127.3900",
  "김제": "35.8034,126.8805", "김제시": "35.8034,126.8805",
  "완주": "35.9070,127.1620", "완주군": "35.9070,127.1620",
  "진안": "35.7908,127.4249", "진안군": "35.7908,127.4249",
  "무주": "35.9066,127.6609", "무주군": "35.9066,127.6609",
  "장수": "35.6470,127.5213", "장수군": "35.6470,127.5213",
  "임실": "35.6179,127.2893", "임실군": "35.6179,127.2893",
  "순창": "35.3748,127.1378", "순창군": "35.3748,127.1378",
  "고창": "35.4355,126.7022", "고창군": "35.4355,126.7022",
  "부안": "35.7318,126.7334", "부안군": "35.7318,126.7334",
  "목포": "34.8118,126.3922", "목포시": "34.8118,126.3922",
  "여수": "34.7604,127.6622", "여수시": "34.7604,127.6622",
  "순천": "34.9506,127.4875", "순천시": "34.9506,127.4875",
  "나주": "35.0160,126.7106", "나주시": "35.0160,126.7106",
  "광양": "34.9403,127.6956", "광양시": "34.9403,127.6956",
  "담양": "35.3214,126.9882", "담양군": "35.3214,126.9882",
  "곡성": "35.2818,127.2918", "곡성군": "35.2818,127.2918",
  "구례": "35.2027,127.4628", "구례군": "35.2027,127.4628",
  "고흥": "34.6070,127.2771", "고흥군": "34.6070,127.2771",
  "보성": "34.7718,127.0802", "보성군": "34.7718,127.0802",
  "화순": "35.0645,126.9868", "화순군": "35.0645,126.9868",
  "장흥": "34.6811,126.9074", "장흥군": "34.6811,126.9074",
  "강진": "34.6415,126.7701", "강진군": "34.6415,126.7701",
  "해남": "34.5737,126.5993", "해남군": "34.5737,126.5993",
  "영암": "34.8003,126.6965", "영암군": "34.8003,126.6965",
  "무안": "34.9900,126.4819", "무안군": "34.9900,126.4819",
  "함평": "35.0653,126.5196", "함평군": "35.0653,126.5196",
  "영광": "35.2770,126.5122", "영광군": "35.2770,126.5122",
  "장성": "35.3016,126.7901", "장성군": "35.3016,126.7901",
  "완도": "34.3104,126.7546", "완도군": "34.3104,126.7546",
  "진도": "34.4865,126.2634", "진도군": "34.4865,126.2634",
  "신안": "34.8274,126.1071", "신안군": "34.8274,126.1071",
  "포항": "36.0190,129.3435", "포항시": "36.0190,129.3435",
  "경주": "35.8562,129.2247", "경주시": "35.8562,129.2247",
  "김천": "36.1396,128.1135", "김천시": "36.1396,128.1135",
  "안동": "36.5684,128.7294", "안동시": "36.5684,128.7294",
  "구미": "36.1195,128.3446", "구미시": "36.1195,128.3446",
  "영주": "36.8057,128.6237", "영주시": "36.8057,128.6237",
  "영천": "35.9735,128.9383", "영천시": "35.9735,128.9383",
  "상주": "36.4110,128.1592", "상주시": "36.4110,128.1592",
  "문경": "36.5862,128.1871", "문경시": "36.5862,128.1871",
  "경산": "35.8247,128.7414", "경산시": "35.8247,128.7414",
  "창원": "35.2280,128.6811", "창원시": "35.2280,128.6811",
  "마산": "35.1833,128.5744",
  "진주": "35.1799,128.1076", "진주시": "35.1799,128.1076",
  "통영": "34.8544,128.4330", "통영시": "34.8544,128.4330",
  "사천": "35.0042,128.0650", "사천시": "35.0042,128.0650",
  "김해": "35.2341,128.8813", "김해시": "35.2341,128.8813",
  "밀양": "35.5038,128.7463", "밀양시": "35.5038,128.7463",
  "거제": "34.8799,128.6211", "거제시": "34.8799,128.6211",
  "양산": "35.3350,129.0364", "양산시": "35.3350,129.0364",
  "제주": "33.4996,126.5312", "제주시": "33.4996,126.5312",
  "서귀포": "33.2541,126.5600", "서귀포시": "33.2541,126.5600",
};

// ============================================================
// RENDER SHARED UI (used by both Korean and global paths)
// ============================================================
function renderUI({
  displayCity, temp, conditionText, localDate, isDay,
  humidity, windSpeedKmh, precipChance, min, max,
  realFeel, uvIndex, visKm, pressureHpa, aqi,
  gif, isRain, isSnow, isThunder, isFog, isCloudy,
  todayAstro, moonData, tzId, localHour,
  forecastDays, allHours, localTimeStr,
  nextVibe, nextEmoji, nextMotion,
}) {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };

  // --- REAL FEEL (full human comfort model) ---
  // Combines: Wind Chill (cold) + Heat Index (hot+humid) + Steadman's middle range
  // + humidity comfort + solar radiation effect
  const T = temp, v = windSpeedKmh, H = humidity;
  const v_ms = v / 3.6;
  const dewPoint = T - ((100 - H) / 5);

  // Actual vapour pressure (humidity effect on how sticky air feels)
  const e = (H / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T));

  let rf;

  if (T <= 10 && v >= 4.8) {
    // Wind Chill (Environment Canada formula) — cold + wind = feels much colder
    rf = 13.12 + (0.6215 * T) - (11.37 * Math.pow(v, 0.16)) + (0.3965 * T * Math.pow(v, 0.16));
    // Extra humidity dryness penalty in cold: dry cold air feels harsher on skin
    if (H < 30) rf -= (30 - H) * 0.05;

  } else if (T >= 27 && H >= 40) {
    // Heat Index (Rothfusz) — hot + humid = body can't cool via sweat
    const c1=-8.78469475556, c2=1.61139411, c3=2.33854883889, c4=-0.14611605,
          c5=-0.012308094,   c6=-0.0164248277778, c7=0.002211732,
          c8=0.00072546,     c9=-0.000003582;
    rf = c1+(c2*T)+(c3*H)+(c4*T*H)+(c5*T*T)+(c6*H*H)+(c7*T*T*H)+(c8*T*H*H)+(c9*T*T*H*H);
    rf = Math.max(rf, T);
    // Wind above 15 km/h provides some relief when hot
    if (v > 15) rf -= (v - 15) * 0.1;

  } else {
    // Middle range: Steadman apparent temperature
    // Accounts for humidity (sticky feeling) and wind (cooling)
    rf = T + (0.33 * e) - (0.70 * v_ms) - 4.00;

    // Extra adjustments for the "feels different" middle range:
    // High humidity at mild temps (18-27°C) makes it feel heavier/stickier
    if (T >= 18 && T < 27 && H > 70) {
      rf += (H - 70) * 0.05; // humid spring/autumn feels warmer and heavier
    }
    // Low humidity at mild temps feels fresher/cooler than actual
    if (T >= 15 && T < 27 && H < 40) {
      rf -= (40 - H) * 0.04; // dry air = more comfortable, feels slightly cooler
    }
    // Cold with no wind but high humidity (damp cold) feels colder
    if (T > 0 && T < 15 && H > 80) {
      rf -= (H - 80) * 0.04; // damp cold feels worse
    }
  }

  rf = parseFloat(rf.toFixed(1));

  // --- DEW POINT / HUMIDITY ---
  // dewPoint already calculated above in real feel section
  let humVibe, humColor;
  if (dewPoint < -5) { humVibe="공기가 많이 건조해요 🏜️"; humColor="#e0f2fe"; }
  else if (dewPoint < 5) { humVibe="조금 건조한 느낌이에요 💨"; humColor="#8fd3f4"; }
  else if (dewPoint < 10) { humVibe="쾌적해서 편안해요 ✨"; humColor="#98ff98"; }
  else if (dewPoint < 13) { humVibe="상쾌한 느낌이에요 🌿"; humColor="#bbf7d0"; }
  else if (dewPoint < 16) { humVibe="공기가 살짝 눅눅하게 느껴져요 🌫️"; humColor="#fde68a"; }
  else if (dewPoint < 18) { humVibe="조금 끈적하게 느껴질 수 있어요 😅"; humColor="#fbbf24"; }
  else if (dewPoint < 21) { humVibe="습해서 조금 무겁게 느껴질 수 있어요 💧"; humColor="#f97316"; }
  else if (dewPoint < 24) { humVibe="답답하게 느껴질 수 있어요 🥵"; humColor="#ef4444"; }
  else { humVibe="숨이 답답할 만큼 습해요… 조금 힘들 수 있어요 🌊🥵"; humColor="#dc2626"; }

  // --- WIND FEELING ---
  let windFeeling, windFeelingColor;
  if (rf <= -10) { windFeeling="숨이 아플 만큼 추워요… 꼭 따뜻하게 입어요 🥶"; windFeelingColor="#a5f3fc"; }
  else if (rf <= 0) { windFeeling="꽁꽁 얼 것 같아요 ❄️"; windFeelingColor="#8fd3f4"; }
  else if (rf <= 8) { windFeeling="차가운 공기가 살짝 아파요 🥶"; windFeelingColor="#bfdbfe"; }
  else if (rf <= 14) { windFeeling="조금 쌀쌀해서 외투가 필요해요 🧊"; windFeelingColor="#c7d2fe"; }
  else if (rf <= 20) { windFeeling="선선하고 기분 좋은 공기예요 🍃"; windFeelingColor="#bbf7d0"; }
  else if (rf <= 25) { windFeeling="딱 좋은 날씨… 편안해요 ✨"; windFeelingColor="#98ff98"; }
  else if (rf <= 30) { windFeeling="따뜻해서 기분이 풀리는 느낌이에요 🌤️"; windFeelingColor="#fde68a"; }
  else if (rf <= 35) { windFeeling="조금 덥고 끈적할 수 있어요 🌡️"; windFeelingColor="#fbbf24"; }
  else if (rf <= 40) { windFeeling="많이 더워요… 무리하지 말아요 🔥"; windFeelingColor="#f97316"; }
  else { windFeeling="숨이 막힐 만큼 더워요… 꼭 쉬어가요 ☀️🔥"; windFeelingColor="#ef4444"; }

  // --- UV ---
  let uvLabel;
  if (uvIndex <= 0) uvLabel="자외선이 거의 없어요";
  else if (uvIndex <= 2) uvLabel="자외선이 약해서 괜찮아요";
  else if (uvIndex <= 5) uvLabel="적당한 수준이에요";
  else if (uvIndex <= 7) uvLabel="자외선이 꽤 강해요… 조금 주의해요";
  else if (uvIndex <= 10) uvLabel="자외선이 많이 강해요… 피부 보호해요";
  else uvLabel="자외선이 매우 위험해요… 꼭 조심해요";

  // --- AQI ---
  let aqiLabel, aqiColor;
  if (!aqi) { aqiLabel="N/A"; aqiColor="#ffffff"; }
  else if (aqi===1) { aqiLabel="공기가 아주 깨끗해요 🟢"; aqiColor="#98ff98"; }
  else if (aqi===2) { aqiLabel="보통이에요 🟡"; aqiColor="#fde68a"; }
  else if (aqi===3) { aqiLabel="민감군은 주의해요 🟠"; aqiColor="#fbbf24"; }
  else if (aqi===4) { aqiLabel="공기가 좋지 않아요 조심해요 🔴"; aqiColor="#f97316"; }
  else if (aqi===5) { aqiLabel="많이 나빠요 외출은 피하는 게 좋아요 🟣"; aqiColor="#c084fc"; }
  else { aqiLabel="위험한 수준이에요 꼭 주의해요 ⚫"; aqiColor="#ef4444"; }

  // --- VISIBILITY ---
  let visLabel, visColor;
  if (visKm >= 10) { visLabel="시야가 맑고 아주 깨끗해요 😎"; visColor="#98ff98"; }
  else if (visKm >= 5) { visLabel="잘 보이는 편이에요 👍"; visColor="#bbf7d0"; }
  else if (visKm >= 2) { visLabel="조금 흐릿하게 보여요 🌫️"; visColor="#fde68a"; }
  else if (visKm >= 1) { visLabel="앞이 잘 안 보여요… 😶‍🌫️"; visColor="#f97316"; }
  else { visLabel="시야가 많이 안 좋아요 주의해요 ⚠️"; visColor="#ef4444"; }

  // --- PRESSURE ---
  let pressureStatus, pressureColor;
  if (pressureHpa < 980) { pressureStatus="기압이 매우 낮아요… 날씨가 불안정해요 ⛈️"; pressureColor="#ef4444"; }
  else if (pressureHpa < 1000) { pressureStatus="기압이 낮아서 날씨가 흐릴 수 있어요 🌧️"; pressureColor="#f97316"; }
  else if (pressureHpa < 1013) { pressureStatus="조금 낮은 상태예요 🌥️"; pressureColor="#fde68a"; }
  else if (pressureHpa < 1020) { pressureStatus="안정된 상태라 편안해요 ✅"; pressureColor="#98ff98"; }
  else if (pressureHpa < 1030) { pressureStatus="맑은 날씨가 이어질 것 같아요 ☀️"; pressureColor="#bbf7d0"; }
  else { pressureStatus="공기가 건조하고 맑아요 🌤️"; pressureColor="#8fd3f4"; }

  // --- ALERTS ---
  const alertBanner = document.getElementById('alertBanner');
  const alertText = document.getElementById('alertText');
  let showAlert=false, alertMsg="";
  if (isThunder) { showAlert=true; alertMsg="⚡ 천둥번개가 있어요 밖에서는 조심해요!"; }
  else if (isSnow && windSpeedKmh > 30) { showAlert=true; alertMsg="🌨️ 눈보라가 심해요… 이동은 피하는 게 좋아요!"; }
  else if (windSpeedKmh > 60) { showAlert=true; alertMsg="💨 바람이 많이 불어요— "+Math.round(windSpeedKmh)+" km/h 주의해요!"; }
  else if (uvIndex >= 8) { showAlert=true; alertMsg="☀️ 자외선이 강해요… 피부 보호 꼭 해요!"; }
  else if (temp >= 38) { showAlert=true; alertMsg="🔥 너무 더워요 물 자주 마시고 쉬어가요!"; }
  else if (temp <= -10) { showAlert=true; alertMsg="🥶 너무 추워요 따뜻하게 꼭 챙겨 입어요!"; }
  if (alertBanner && alertText) {
    if (showAlert) { alertText.innerText=alertMsg; alertBanner.classList.remove('hidden'); }
    else alertBanner.classList.add('hidden');
  }

  // --- OUTFIT ---
  let outfit="편하게 입어도 괜찮아요", emo="👕", mot="motion-float";
  if (isThunder) { outfit="오늘은 밖에 나가지 않는 게 좋아요!"; emo="⚡"; mot="motion-storm"; }
  else if (isRain) { outfit="비가 와요 우산 꼭 챙겨요"; emo="☔"; mot="motion-rain"; }
  else if (isSnow) { outfit="눈이 와요 따뜻하게 입어요"; emo="⛄"; mot="motion-shiver"; }
  else if (isFog) { outfit="안개가 껴요 운전 조심해요"; emo="🌫️"; mot="motion-float"; }
  else if (temp < 12) { outfit="쌀쌀해요 따뜻하게 입어요"; emo="🧥"; mot="motion-shiver"; }
  else if (temp > 28) { outfit="더워요 가볍게 입는 게 좋아요"; emo="🩳"; mot="motion-bounce"; }

  // --- NEXT UP EMOJI ---
  const nextEmojiEl = document.getElementById('nextUpEmoji');
  if (nextEmojiEl) { nextEmojiEl.innerText=nextEmoji; nextEmojiEl.className=nextMotion; }
  document.getElementById('nextUpVal').innerText = nextVibe;

  // --- POPULATE DOM ---
  document.getElementById('cityName').innerHTML = `<i class="fas fa-location-arrow"></i> ${displayCity}`;
  document.getElementById('temp').innerText = Math.round(temp)+"°C";
  document.getElementById('description').innerText = conditionText;
  document.getElementById('todayDate').innerText = localDate.toLocaleDateString('ko-KR', options);
  document.getElementById('realFeelVal').innerText = `${rf.toFixed(1)}°C`;

  const realFeelCard = document.querySelector('#realFeelVal').closest('.vibe-card').querySelector('div');
  let rfEmoji, rfMotion;
  if (rf<=0){rfEmoji="🥶";rfMotion="motion-shiver";}
  else if(rf<=8){rfEmoji="🧊";rfMotion="motion-shiver";}
  else if(rf<=14){rfEmoji="🍃";rfMotion="motion-sway";}
  else if(rf<=20){rfEmoji="😌";rfMotion="motion-float";}
  else if(rf<=25){rfEmoji="☀️";rfMotion="motion-bounce";}
  else if(rf<=32){rfEmoji="🌡️";rfMotion="motion-bounce";}
  else{rfEmoji="🔥";rfMotion="motion-storm";}
  realFeelCard.innerText=rfEmoji; realFeelCard.className=rfMotion;

  document.getElementById('humidityVal').innerText = `${humidity}%`;
  const hStatus = document.getElementById('humidityStatus');
  if (hStatus) { hStatus.innerText=humVibe; hStatus.style.color=humColor; }

  document.getElementById('windVal').innerText = `${Math.round(windSpeedKmh)} km/h`;
  const wStatus = document.getElementById('windStatus');
  if (wStatus) { wStatus.innerText=windFeeling; wStatus.style.color=windFeelingColor; }

  document.getElementById('precipVal').innerText = `${precipChance}%`;
  document.getElementById('precipBarInner').style.width = `${precipChance}%`;

  document.getElementById('pressureVal').innerText = `${pressureHpa} hPa`;
  const pStatusEl = document.getElementById('pressureStatus');
  if (pStatusEl) { pStatusEl.innerText=pressureStatus; pStatusEl.style.color=pressureColor; }

  document.getElementById('aqiVal').innerText = aqi ? `Index ${aqi}` : "N/A";
  const aqiStatusEl = document.getElementById('aqiStatus');
  if (aqiStatusEl) { aqiStatusEl.innerText=aqiLabel; aqiStatusEl.style.color=aqiColor; }

  document.getElementById('visVal').innerText = `${visKm} km`;
  const visStatusEl = document.getElementById('visStatus');
  if (visStatusEl) { visStatusEl.innerText=visLabel; visStatusEl.style.color=visColor; }

  document.getElementById('minTemp').innerText = Math.round(min)+"°";
  document.getElementById('maxTemp').innerText = Math.round(max)+"°";
  let range=max-min, percent=(range<=0)?50:((temp-min)/range)*100;
  const marker=document.getElementById('tempMarker');
  const clamped=Math.min(Math.max(percent,0),100);
  marker.style.transition="none"; marker.style.left="0%"; marker.offsetHeight;
  marker.style.transition="left 1s cubic-bezier(0.25, 1, 0.5, 1)";
  marker.style.left=`${clamped}%`;

  document.getElementById('sunriseTime').innerText = todayAstro.sunrise;
  document.getElementById('sunsetTime').innerText = todayAstro.sunset;
  document.getElementById('sunriseIcon').className = "solar-sun animate-sunrise";
  document.getElementById('sunsetIcon').className = "solar-sun animate-sunset";

  const moonIconEl = document.getElementById('moonIcon');
  const moonTextEl = document.getElementById('moonPhaseText');
  if (moonIconEl) moonIconEl.innerText = moonData.emoji;
  if (moonTextEl) moonTextEl.innerText = moonData.korean;

  const eBox = document.getElementById('outfitEmoji');
  if (eBox) { eBox.innerText=emo; eBox.className=mot; }
  document.getElementById('outfitVal').innerText = outfit;

  document.getElementById('runVal').innerText =
    (temp>12 && temp<25 && !isRain && !isFog && precipChance<50)
    ? "뛰기 딱 좋아요 🏃‍♀️" : "오늘은 조금 피하는 게 좋아요";
  document.getElementById('driveVal').innerText =
    (windSpeedKmh>20 || isRain || isFog)
    ? "조심해서 운전해요 🚗" : "편하게 운전해도 괜찮아요";
  document.getElementById('pollenVal').innerText =
    (isDay && !isRain && !isCloudy) ? "꽃가루가 많아요 🌼" : "괜찮은 수준이에요";
  document.getElementById('uvVal').innerText = uvLabel;

  // Icons
  const iconEl = document.getElementById('mainWeatherIcon');
  const timeIconEl = document.getElementById('timeIcon');
  const hasConditionIcon = isThunder || isSnow || isRain || isFog || isCloudy;
  if (hasConditionIcon) {
    iconEl.src=`assets/icons/${gif}`; iconEl.style.display='block';
    timeIconEl.src=isDay?'assets/icons/sunny.png':'assets/icons/moon.gif';
    timeIconEl.style.display='block';
  } else {
    iconEl.src=isDay?'assets/icons/sunny.png':'assets/icons/moon.gif';
    iconEl.style.display='block';
    timeIconEl.style.display='none';
  }

  updateDynamicBackground(localHour);
  updateLiveClock(tzId, temp);

  document.getElementById('portal').classList.add('hidden');
  document.getElementById('portalVideo').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('bgVideo').classList.remove('hidden');

  window.history.pushState({page:"dashboard"}, "Weather", "");
  localStorage.setItem('lastVibe', JSON.stringify({city:displayCity, temp:Math.round(temp)+"°C"}));
  document.querySelectorAll('.vibe-card, .forecast-card, .hourly-card').forEach(card => {
    card.addEventListener('mouseenter', playHover);
  });
  showHistory();

  if (isRain || isThunder) playAmbient('rain');
  else if (isSnow || temp < 2) playAmbient('winter');
  else if (isDay) playAmbient('sunny');
  else playAmbient('night');

  renderForecast(forecastDays);
  renderHourly(allHours, localTimeStr);
}

// ============================================================
// KOREAN PATH — Open-Meteo + KMA model
// ============================================================
async function getVibeKorean(lat, lon, displayCity) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
    `precipitation_probability,precipitation,weather_code,cloud_cover,` +
    `wind_speed_10m,surface_pressure,visibility,uv_index,is_day` +
    `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,apparent_temperature` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,` +
    `precipitation_probability_max,sunrise,sunset,uv_index_max` +
    `&timezone=Asia%2FSeoul&forecast_days=6&models=kma_seamless`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.reason || 'Open-Meteo error');

  const c = data.current;
  const daily = data.daily;
  const hourly = data.hourly;

  const temp = c.temperature_2m;
  const humidity = c.relative_humidity_2m;
  const windSpeedKmh = c.wind_speed_10m;
  const precipChance = c.precipitation_probability ?? daily.precipitation_probability_max[0] ?? 0;
  const weatherCode = c.weather_code;
  const pressureHpa = Math.round(c.surface_pressure);
  const visKm = parseFloat((c.visibility / 1000).toFixed(1));
  const uvIndex = c.uv_index ?? daily.uv_index_max[0] ?? 0;
  const isDay = c.is_day === 1;

  const min = daily.temperature_2m_min[0];
  const max = daily.temperature_2m_max[0];
  const conditionText = wmoToKorean(weatherCode);
  const gif = wmoToGif(weatherCode, isDay);

  const isRain = wmoIsRain(weatherCode);
  const isSnow = wmoIsSnow(weatherCode);
  const isThunder = wmoIsThunder(weatherCode);
  const isFog = wmoIsFog(weatherCode);
  const isCloudy = wmoIsCloudy(weatherCode);

  // Sunrise / sunset from daily
  const sunriseRaw = daily.sunrise[0]; // "2024-04-13T05:23"
  const sunsetRaw = daily.sunset[0];
  const fmtTime = (str) => {
    // Open-Meteo returns "2026-04-13T05:23" already in Asia/Seoul — parse directly
    // Do NOT use new Date() which would apply local browser timezone offset
    const timePart = str.split('T')[1];
    let h = parseInt(timePart.split(':')[0]);
    const m = timePart.split(':')[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h.toString().padStart(2,'0')}:${m} ${ampm}`;
  };
  const todayAstro = { sunrise: fmtTime(sunriseRaw), sunset: fmtTime(sunsetRaw) };
  const moonData = getMoonPhase(new Date());

  // Timezone
  const tzId = 'Asia/Seoul';
  const nowSeoul = new Date(new Date().toLocaleString('en-US', {timeZone: tzId}));
  const localHour = nowSeoul.getHours();
  const localDate = nowSeoul;

  // localTimeStr for hourly filtering — format "YYYY-MM-DDTHH:MM"
  const pad = n => n.toString().padStart(2,'0');
  const localTimeStr = `${nowSeoul.getFullYear()}-${pad(nowSeoul.getMonth()+1)}-${pad(nowSeoul.getDate())}T${pad(localHour)}:${pad(nowSeoul.getMinutes())}`;

  // Build hourly array compatible with renderHourly
  const hourlyArr = hourly.time.map((t, i) => ({
    time: t,
    temp_c: hourly.temperature_2m[i],
    chance_of_rain: hourly.precipitation_probability[i] ?? 0,
    condition: { icon: wmoToWeatherApiIcon(hourly.weather_code[i], i) },
  }));

  // 5-hour look-ahead
  const nowMs = nowSeoul.getTime();
  const targetMs = nowMs + 5*60*60*1000;
  const nextData = hourlyArr.find(h => new Date(h.time).getTime() >= targetMs) || hourlyArr[hourlyArr.length-1];
  let nextVibe, nextEmoji, nextMotion;
  if (nextData.chance_of_rain > 40) { nextVibe="5시간 뒤 비가 올 것 같아요 "; nextEmoji="☔"; nextMotion="motion-rain"; }
  else if (nextData.temp_c > temp+3) { nextVibe="5시간 뒤 조금 더 따뜻해질 거예요 "; nextEmoji="☀️"; nextMotion="motion-bounce"; }
  else if (nextData.temp_c < temp-3) { nextVibe="5시간 뒤 조금 더 쌀쌀해져요 "; nextEmoji="🧣"; nextMotion="motion-shiver"; }
  else { nextVibe="당분간 큰 변화 없이 잔잔해요 "; nextEmoji="✨"; nextMotion="motion-float"; }

  // Build forecastDays compatible with renderForecast
  const forecastDays = daily.time.slice(1).map((date, i) => ({
    date,
    day: {
      maxtemp_c: daily.temperature_2m_max[i+1],
      mintemp_c: daily.temperature_2m_min[i+1],
      daily_chance_of_rain: daily.precipitation_probability_max[i+1] ?? 0,
      condition: { icon: wmoToWeatherApiIcon(daily.weather_code[i+1], null) },
    }
  }));

  // AQI — Open-Meteo has a separate AQI endpoint (optional, graceful fallback)
  let aqi = null;
  try {
    const aqiRes = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=Asia%2FSeoul`
    );
    const aqiData = await aqiRes.json();
    const rawAqi = aqiData.current?.us_aqi;
    if (rawAqi !== undefined) {
      // Convert US AQI number → 1-6 index matching our labels
      if (rawAqi <= 50) aqi = 1;
      else if (rawAqi <= 100) aqi = 2;
      else if (rawAqi <= 150) aqi = 3;
      else if (rawAqi <= 200) aqi = 4;
      else if (rawAqi <= 300) aqi = 5;
      else aqi = 6;
    }
  } catch(e) { console.log('AQI fetch failed, skipping:', e); }

  renderUI({
    displayCity, temp, conditionText, localDate, isDay,
    humidity, windSpeedKmh, precipChance, min, max,
    realFeel: c.apparent_temperature,
    uvIndex, visKm, pressureHpa, aqi,
    gif, isRain, isSnow, isThunder, isFog, isCloudy,
    todayAstro, moonData, tzId, localHour,
    forecastDays, allHours: hourlyArr, localTimeStr,
    nextVibe, nextEmoji, nextMotion,
  });
}

// Open-Meteo doesn't have icons — use WeatherAPI CDN icons via WMO mapping
function wmoToWeatherApiIcon(code, hourIndex) {
  // Map WMO codes to WeatherAPI condition codes for icons
  const iconMap = {
    0: '113', 1: '116', 2: '116', 3: '119',
    45: '143', 48: '260',
    51: '263', 53: '266', 55: '296',
    56: '281', 57: '284',
    61: '296', 63: '302', 65: '308',
    66: '311', 67: '314',
    71: '323', 73: '329', 75: '335',
    77: '350',
    80: '353', 81: '356', 82: '359',
    85: '368', 86: '371',
    95: '386', 96: '392', 99: '395',
  };
  const wCode = iconMap[code] || '116';
  return `//cdn.weatherapi.com/weather/64x64/day/${wCode}.png`;
}

// ============================================================
// GLOBAL PATH — WeatherAPI (unchanged)
// ============================================================
async function getVibeGlobal(city, originalQuery) {
  const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=6&aqi=yes&alerts=no&lang=ko`);
  const data = await res.json();
  if (data.error) return alert(`날씨 정보를 찾을 수 없어요 😢\n다른 도시명으로 검색해보세요!`);

  const current = data.current;
  const location = data.location;
  const localDate = new Date(location.localtime);
  const forecastDay = data.forecast.forecastday;
  const todayAstro = forecastDay[0].astro;
  const todayDay = forecastDay[0].day;

  const temp = current.temp_c;
  const humidity = current.humidity;
  const windSpeedKmh = current.wind_kph;
  const isDay = current.is_day === 1;
  const conditionText = current.condition.text;
  const conditionCode = current.condition.code;
  const uvIndex = current.uv;
  const visKm = current.vis_km;
  const pressureHpa = current.pressure_mb;
  const tzId = location.tz_id;
  const localTimeStr = location.localtime;
  const localHour = parseInt(localTimeStr.split(' ')[1].split(':')[0]);
  const min = todayDay.mintemp_c;
  const max = todayDay.maxtemp_c;
  const precipChance = todayDay.daily_chance_of_rain;

  const isRain = (conditionCode>=1180&&conditionCode<=1201)||conditionCode===1063;
  const isDrizzle = (conditionCode>=1150&&conditionCode<=1171)||conditionCode===1072;
  const isSnow = conditionCode>=1210&&conditionCode<=1282&&!conditionText.toLowerCase().includes("thunder");
  const isThunder = conditionCode===1087||(conditionCode>=1273&&conditionCode<=1282);
  const isSleet = conditionCode>=1204&&conditionCode<=1207;
  const isHail = conditionCode>=1237||conditionCode===1261||conditionCode===1264;
  const isFog = conditionCode===1135||conditionCode===1147;
  const isBlizzard = conditionCode===1117;
  const isOvercast = conditionCode===1009;
  const isCloudy = conditionCode>=1003&&conditionCode<=1030;

  let gif;
  if (isThunder) gif="Strom.gif";
  else if (isBlizzard) gif="blizzard.png";
  else if (isSnow) gif="snow.png";
  else if (isHail) gif="hail.gif";
  else if (isSleet) gif="sleet.png";
  else if (isRain||isDrizzle) gif=isDay?"rain day.png":"rain.png";
  else if (isFog) gif="fog.png";
  else if (isOvercast) gif="Cloudy_overcast.png";
  else if (isCloudy) gif=isDay?"cloudy day.png":"cloudy night.png";
  else gif=isDay?"sunny.png":"moon.gif";

  const conditionMap = {
    "Sunny":"맑음","Clear":"맑음","Partly cloudy":"구름 조금","Cloudy":"흐림",
    "Overcast":"완전 흐림","Mist":"안개","Fog":"짙은 안개","Freezing fog":"결빙 안개",
    "Patchy rain possible":"비 올 수도 있어요","Patchy snow possible":"눈 올 수도 있어요",
    "Blowing snow":"눈보라","Blizzard":"강한 눈보라","Thundery outbreaks possible":"천둥 가능",
    "Patchy light drizzle":"가벼운 이슬비","Light drizzle":"이슬비","Freezing drizzle":"결빙 이슬비",
    "Heavy freezing drizzle":"강한 결빙 이슬비","Patchy light rain":"가벼운 비",
    "Light rain":"가벼운 비","Moderate rain at times":"때때로 비","Moderate rain":"보통 비",
    "Heavy rain at times":"때때로 강한 비","Heavy rain":"강한 비",
    "Light freezing rain":"가벼운 결빙 비","Moderate or heavy freezing rain":"강한 결빙 비",
    "Light sleet":"가벼운 진눈깨비","Moderate or heavy sleet":"강한 진눈깨비",
    "Patchy light snow":"가벼운 눈","Light snow":"가벼운 눈","Patchy moderate snow":"보통 눈",
    "Moderate snow":"보통 눈","Patchy heavy snow":"강한 눈","Heavy snow":"강한 눈",
    "Ice pellets":"우박","Light rain shower":"소나기","Moderate or heavy rain shower":"강한 소나기",
    "Torrential rain shower":"폭우","Light sleet showers":"가벼운 진눈깨비 소나기",
    "Light snow showers":"가벼운 눈 소나기","Moderate or heavy snow showers":"강한 눈 소나기",
    "Light showers of ice pellets":"가벼운 우박","Moderate or heavy showers of ice pellets":"강한 우박",
    "Thunderstorm":"천둥번개","Patchy light rain with thunder":"천둥 동반 가벼운 비",
    "Moderate or heavy rain with thunder":"천둥 동반 강한 비",
    "Patchy light snow with thunder":"천둥 동반 가벼운 눈",
    "Moderate or heavy snow with thunder":"천둥 동반 강한 눈",
  };
  const condKorean = conditionMap[conditionText] || conditionText;

  const moonPhaseRaw = todayAstro.moon_phase;
  const moonMap = {
    "New Moon":{emoji:"🌑",korean:"신월"},"Waxing Crescent":{emoji:"🌒",korean:"초승달"},
    "First Quarter":{emoji:"🌓",korean:"상현달"},"Waxing Gibbous":{emoji:"🌔",korean:"차오르는 달"},
    "Full Moon":{emoji:"🌕",korean:"보름달"},"Waning Gibbous":{emoji:"🌖",korean:"기우는 달"},
    "Last Quarter":{emoji:"🌗",korean:"하현달"},"Waning Crescent":{emoji:"🌘",korean:"그믐달"},
  };
  const moonData = moonMap[moonPhaseRaw]||{emoji:"🌑",korean:moonPhaseRaw};

  const aqi = data.current.air_quality ? data.current.air_quality['us-epa-index'] : null;

  const combinedHours = [...forecastDay[0].hour, ...forecastDay[1].hour];
  const nowMs = new Date(location.localtime).getTime();
  const targetMs = nowMs + 5*60*60*1000;
  const nextData = combinedHours.find(h=>new Date(h.time).getTime()>=targetMs)||combinedHours[combinedHours.length-1];
  let nextVibe, nextEmoji, nextMotion;
  if (nextData.chance_of_rain>40){nextVibe="5시간 뒤 비가 올 것 같아요 ";nextEmoji="☔";nextMotion="motion-rain";}
  else if(nextData.temp_c>temp+3){nextVibe="5시간 뒤 조금 더 따뜻해질 거예요 ";nextEmoji="☀️";nextMotion="motion-bounce";}
  else if(nextData.wind_kph>windSpeedKmh+15){nextVibe="5시간 뒤 바람이 강해질 수 있어요 ";nextEmoji="🍃";nextMotion="motion-sway";}
  else if(nextData.temp_c<temp-3){nextVibe="5시간 뒤 조금 더 쌀쌀해져요 ";nextEmoji="🧣";nextMotion="motion-shiver";}
  else{nextVibe="당분간 큰 변화 없이 잔잔해요 ";nextEmoji="✨";nextMotion="motion-float";}

  const displayCity = location.region
    ? `${location.name}, ${location.region}, ${location.country}`
    : `${location.name}, ${location.country}`;

  renderUI({
    displayCity, temp, conditionText: condKorean, localDate, isDay,
    humidity, windSpeedKmh, precipChance, min, max,
    realFeel: null,
    uvIndex, visKm, pressureHpa, aqi,
    gif, isRain: isRain||isDrizzle, isSnow, isThunder, isFog, isCloudy,
    todayAstro, moonData, tzId, localHour,
    forecastDays: forecastDay, allHours: combinedHours, localTimeStr,
    nextVibe, nextEmoji, nextMotion,
  });
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================
async function getVibe(city, originalQuery = null) {
  if (!city) return;
  if (!originalQuery) originalQuery = city;

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) { searchBtn.disabled=true; searchBtn.innerText='불러오는 중...'; }

  const isKorean = /[가-힣]/.test(city);

  try {
    if (isKorean) {
      // Resolve coordinates
      const stripped = city.replace(/(특별시|광역시|특별자치시|특별자치도|특별자치|시|군|구)$/,'');
      const coordLookups = [city, stripped, stripped+"시", stripped+"군"];
      let coordStr = null;
      for (const key of coordLookups) {
        if (koreanCityCoords[key]) { coordStr=koreanCityCoords[key]; break; }
      }
      if (!coordStr) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&countrycodes=kr&format=json&limit=1`);
          const geoData = await geoRes.json();
          if (geoData && geoData[0]) coordStr=`${geoData[0].lat},${geoData[0].lon}`;
          else { alert(`'${originalQuery}'을(를) 찾을 수 없어요 😢\n더 정확한 지역명으로 다시 검색해보세요!`); return; }
        } catch(e) { alert('검색 중 오류가 발생했어요 😢 다시 시도해주세요.'); return; }
      }
      const [lat, lon] = coordStr.split(',');
      await getVibeKorean(lat, lon, originalQuery);

    } else {
      // Geo coords typed directly (from geolocation button)
      const isCoords = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(city.trim());
      if (isCoords) {
        const [lat, lon] = city.split(',');
        // Use reverse geocoding to get display name, then Open-Meteo for weather
        let displayCity = city;
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const geoData = await geoRes.json();
          if (geoData) {
            const addr = geoData.address;
            displayCity = addr.city || addr.town || addr.village || addr.county || geoData.display_name.split(',')[0];
          }
        } catch(e) {}
        // Check if it's in Korea
        const latN = parseFloat(lat), lonN = parseFloat(lon);
        const isKorea = latN>=33&&latN<=39&&lonN>=124&&lonN<=132;
        if (isKorea) {
          await getVibeKorean(lat, lon, displayCity);
        } else {
          await getVibeGlobal(city, originalQuery);
        }
      } else {
        await getVibeGlobal(city, originalQuery);
      }
    }
  } catch(e) {
    console.error("Error:", e);
    alert("Something went wrong. Please try again.");
  } finally {
    if (searchBtn) { searchBtn.disabled=false; searchBtn.innerText='검색'; }
  }
}

// ============================================================
// FORECAST & HOURLY RENDERERS
// ============================================================
function renderForecast(forecastDays) {
  const container = document.getElementById('forecastContainer');
  if (!container) return;
  let html = '';
  forecastDays.slice(1).forEach(day => {
    const dayName = new Date(day.date).toLocaleDateString('ko-KR', {weekday:'short'});
    const icon = day.day.condition.icon;
    const maxT = Math.round(day.day.maxtemp_c);
    const minT = Math.round(day.day.mintemp_c);
    const rain = day.day.daily_chance_of_rain;
    const iconSrc = icon.startsWith('//') ? `https:${icon}` : icon;
    html += `<div class="forecast-list-item">
      <span class="f-day">${dayName}</span>
      <img src="${iconSrc}" style="width:28px;height:28px;">
      <span style="font-size:0.7rem;opacity:0.6;margin:0 8px;">💧${rain}%</span>
      <span class="f-temps">${maxT}° <span>${minT}°</span></span>
    </div>`;
  });
  container.innerHTML = html;
}

function renderHourly(allHours, localTimeStr) {
  const container = document.getElementById('hourlyContainer');
  if (!container) return;
  const futureHours = allHours.filter(h => h.time > localTimeStr);
  const next12 = futureHours.slice(0, 12);
  let html = '';
  next12.forEach(h => {
    const hHour = new Date(h.time).getHours();
    const label = hHour===0?"12AM":hHour<12?`${hHour}AM`:hHour===12?"12PM":`${hHour-12}PM`;
    const icon = h.condition.icon;
    const hTemp = Math.round(h.temp_c);
    const rain = h.chance_of_rain;
    const rainStyle = rain>40?"color:#ff9a9e;font-weight:bold;opacity:1;":"opacity:0.6;";
    const iconSrc = icon.startsWith('//') ? `https:${icon}` : icon;
    html += `<div class="hourly-card">
      <p class="hourly-time">${label}</p>
      <img src="${iconSrc}" style="width:30px;height:30px;">
      <p class="hourly-temp">${hTemp}°</p>
      <p style="font-size:0.55rem;margin-top:2px;${rainStyle}">💧${rain}%</p>
    </div>`;
  });
  container.innerHTML = html;
}

// ============================================================
// EVENT LISTENERS
// ============================================================
document.getElementById('searchBtn').onclick = () => {
  sounds.click.currentTime=0; sounds.click.play().catch(()=>{});
  const city = document.getElementById('cityInput').value.trim();
  if (city) getVibe(city);
};
document.getElementById('cityInput').onkeydown = (e) => {
  if (e.key==='Enter') getVibe(e.target.value.trim());
};
document.getElementById('backBtn').onclick = () => {
  sounds.click.currentTime=0; sounds.click.play().catch(()=>{});
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('bgVideo').classList.add('hidden');
  document.getElementById('portal').classList.remove('hidden');
  document.getElementById('portalVideo').classList.remove('hidden');
};
document.getElementById('lastCity').onclick = () => {
  sounds.click.currentTime=0; sounds.click.play().catch(()=>{});
  const saved = localStorage.getItem('lastVibe');
  if (saved) { const d=JSON.parse(saved); getVibe(d.city); }
};
document.getElementById('geoBtn').onclick = () => {
  const btn = document.getElementById('geoBtn');
  if (!navigator.geolocation) { alert('이 브라우저는 위치 서비스를 지원하지 않아요.'); return; }
  btn.innerText='📍 위치 찾는 중...'; btn.disabled=true;
  sounds.click.currentTime=0; sounds.click.play().catch(()=>{});
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords=`${pos.coords.latitude},${pos.coords.longitude}`;
      btn.innerText='📍 내 위치 날씨 보기'; btn.disabled=false;
      getVibe(coords);
    },
    (err) => {
      btn.innerText='📍 내 위치 날씨 보기'; btn.disabled=false;
      if (err.code===1) alert('위치 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요.');
      else alert('위치를 가져오지 못했어요. 다시 시도해 주세요.');
    },
    {timeout:10000, maximumAge:60000}
  );
};

document.getElementById('shareBtn').onclick = async () => {
  const city = document.getElementById('cityName').innerText.replace(/[^\w\s,가-힣]/g,'').trim();
  const temp = document.getElementById('temp').innerText;
  const desc = document.getElementById('description').innerText;
  const feel = document.getElementById('realFeelVal').innerText;
  const humidity = document.getElementById('humidityVal').innerText;
  const wind = document.getElementById('windVal').innerText;
  const shareText = `🌤️ ${city} 날씨\n🌡️ ${temp} — ${desc}\n🤔 체감온도: ${feel}\n💧 습도: ${humidity}\n💨 바람: ${wind}\n\nVibeWeather Pro에서 확인했어요`;
  if (navigator.share) {
    await navigator.share({title:'VibeWeather Pro', text:shareText});
  } else {
    navigator.clipboard.writeText(shareText);
    const btn=document.getElementById('shareBtn');
    btn.innerText='✅ 클립보드에 복사됐어요!';
    setTimeout(()=>btn.innerText='📤 날씨 공유하기',2000);
  }
};

function initializeDefaultDate() {
  const seoulDate = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Seoul'}));
  const dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.innerText=seoulDate.toLocaleDateString('ko-KR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}
initializeDefaultDate();
