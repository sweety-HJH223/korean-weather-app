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
let isMuted = true; // starts muted

function playAmbient(name) {
  if (currentAmbient && currentAmbient === sounds[name] && !currentAmbient.paused) return;

  // stop old
  if (currentAmbient) {
    currentAmbient.pause();
    currentAmbient.currentTime = 0;
    currentAmbient.volume = 0.3;
  }

  currentAmbient = sounds[name];
  currentAmbient.volume = 0.3;

  if (!isMuted) {
    currentAmbient.play().catch(e => console.log('Audio blocked:', e));
  }
}
function playHover() {
  if (isMuted) return;
  sounds.hover.currentTime = 0;
  sounds.hover.volume = 0.8;
  sounds.hover.play().catch(() => {});
}
// The button turns sound on/off
window.addEventListener('load', () => {
  const btn = document.getElementById('soundBtn');
  if (!btn) return;

  btn.onclick = () => {
    isMuted = !isMuted;
    btn.innerText = isMuted ? '🔇' : '🔊';

    if (isMuted) {
      if (currentAmbient) {
        currentAmbient.pause();
        currentAmbient.currentTime = 0;
      }
    } else {
      // play click first so browser unlocks audio
      sounds.click.currentTime = 0;
      sounds.click.play().catch(() => {});
      // then play whatever ambient is loaded
      if (currentAmbient) {
        currentAmbient.play().catch(e => console.log(e));
      }
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
    return clockInterval; 
}

function updateDynamicBackground(hour) {
    const video = document.getElementById('bgVideo');
    const overlay = document.querySelector('.overlay-glow');
    if (!video) return;

    let videoSrc = "assets/images/night.mp4";
    let glow = "radial-gradient(circle, transparent, rgba(0,0,0,0.7))";

    if (hour >= 5 && hour < 11) {
        videoSrc = "assets/images/morning.mp4";
        glow = "radial-gradient(circle, rgba(255,223,0,0.1), rgba(0,0,0,0.4))";
    } else if (hour >= 11 && hour < 17) {
        videoSrc = "assets/images/afternoon.mp4";
        glow = "radial-gradient(circle, rgba(255,255,255,0.05), rgba(0,0,0,0.4))";
    } else if (hour >= 17 && hour < 20) {
        videoSrc = "assets/images/evening.mp4";
        glow = "radial-gradient(circle, rgba(255,69,0,0.15), rgba(0,0,0,0.5))";
    }

    if (!video.src.includes(videoSrc)) {
        video.src = videoSrc;
        if (overlay) overlay.style.background = glow;
        video.load();
        video.play().catch(e => console.log("Video play error:", e));
    }
}

// --- MAIN FUNCTION ---
async function getVibe(city) {
    if (!city) return;
  if (/[가-힣]/.test(city)) {
    city = city
        .replace(/(특별시|광역시|특별자치시|특별자치도|경기도|강원도|충청북도|충청남도|전라북도|전라남도|경상북도|경상남도|제주도)/g, '')
        .replace(/\S+[읍면동리]/g, '')
        .replace(/\S+[구군]/g, '')
        .trim()
        .split(/\s+/)[0]
        .replace(/시$/, '');
}
    
    try {
        // Add &lang=ko to the end of the URL
        const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=6&aqi=yes&alerts=no&lang=ko`);
        const data = await res.json();

       if (data.error) {
    // fallback map for cities WeatherAPI doesn't know
    const fallback = {
        "남양주": "Guri", "하남": "Hanam", "구리": "Guri",
        "양주": "Uijeongbu", "동두천": "Uijeongbu", "연천": "Uijeongbu",
        "가평": "Chuncheon", "양평": "Yeoju", "여주": "Yeoju",
        "진천": "Cheongju", "음성": "Cheongju", "증평": "Cheongju",
        "고창": "Jeonju", "부안": "Jeonju", "임실": "Jeonju",
        "함평": "Mokpo", "신안": "Mokpo", "진도": "Mokpo",
        "울릉": "Pohang", "봉화": "Andong", "영양": "Andong",
        "청송": "Andong", "영덕": "Pohang", "고령": "Daegu",
        "성주": "Daegu", "칠곡": "Daegu", "의령": "Jinju",
        "함안": "Changwon", "창녕": "Changwon", "남해": "Jinju",
        "하동": "Jinju", "산청": "Jinju", "거창": "Jinju",
        "합천": "Jinju",
    };
    const nearby = fallback[city];
    if (nearby) {
        console.log(`Falling back to nearby city: ${nearby}`);
        return getVibe(nearby);
    }
    return alert(`도시를 찾을 수 없어요 😢\n서울, 부산, 수원 같은 큰 도시명으로 검색해보세요!`);
}
        // --- EXTRACT DATA ---
        const current = data.current;
        const location = data.location;
        const localDate = new Date(location.localtime);
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
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
        


// --- NEW 5-HOUR LOOK AHEAD LOGIC ---
const hoursToLookAhead = 5;
const nowMs = new Date(location.localtime).getTime();
const targetTimeMs = nowMs + (hoursToLookAhead * 60 * 60 * 1000);

// Combine today and tomorrow hours so we can see past midnight
const combinedHours = [...forecastDay[0].hour, ...forecastDay[1].hour];

// Find the data for exactly 5 hours from now
const nextData = combinedHours.find(h => new Date(h.time).getTime() >= targetTimeMs) || combinedHours[0];

let nextVibe, nextEmoji, nextMotion;

// Check conditions for that future hour
if (nextData.chance_of_rain > 40) {
    nextVibe = `${hoursToLookAhead}시간 뒤 비가 올 것 같아요 `;
    nextEmoji = "☔";
    nextMotion = "motion-rain";
} else if (nextData.temp_c > temp + 3) {
    nextVibe = `${hoursToLookAhead}시간 뒤 조금 더 따뜻해질 거예요 `;
    nextEmoji = "☀️";
    nextMotion = "motion-bounce";
} else if (nextData.wind_kph > windSpeedKmh + 15) {
    nextVibe = `${hoursToLookAhead}시간 뒤 바람이 강해질 수 있어요 `;
    nextEmoji = "🍃";
    nextMotion = "motion-sway";
} else if (nextData.temp_c < temp - 3) {
    nextVibe = `${hoursToLookAhead}시간 뒤 조금 더 쌀쌀해져요 `;
    nextEmoji = "🧣";
    nextMotion = "motion-shiver";
} else {
    nextVibe = "당분간 큰 변화 없이 잔잔해요 ";
    nextEmoji = "✨";
    nextMotion = "motion-float";
}

// Update the Card UI
const nextEmojiEl = document.getElementById('nextUpEmoji');
if (nextEmojiEl) {
    nextEmojiEl.innerText = nextEmoji;
    nextEmojiEl.className = nextMotion; 
}
document.getElementById('nextUpVal').innerText = nextVibe;


        const min = todayDay.mintemp_c;
        const max = todayDay.maxtemp_c;
        const precipChance = todayDay.daily_chance_of_rain;

        // --- REAL FEEL ---
        const T = temp;
        const v = windSpeedKmh;
        const H = humidity;

        let realFeel;
        if (T <= 10 && v >= 4.8) {
            realFeel = 13.12 + (0.6215 * T) - (11.37 * Math.pow(v, 0.16)) + (0.3965 * T * Math.pow(v, 0.16));
        } else if (T >= 27 && H >= 40) {
            const c1 = -8.78469475556, c2 = 1.61139411, c3 = 2.33854883889;
            const c4 = -0.14611605, c5 = -0.012308094, c6 = -0.0164248277778;
            const c7 = 0.002211732, c8 = 0.00072546, c9 = -0.000003582;
            realFeel = c1 + (c2*T) + (c3*H) + (c4*T*H) + (c5*T*T) + (c6*H*H) + (c7*T*T*H) + (c8*T*H*H) + (c9*T*T*H*H);
        } else {
            const v_ms = v / 3.6;
            let e = (H / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T));
            realFeel = T + (0.33 * e) - (0.70 * v_ms) - 4.00;
        }
        realFeel = parseFloat(realFeel.toFixed(1));

        // --- HUMIDITY DEW POINT ---
        const dewPoint = T - ((100 - H) / 5);
        let humVibe, humColor;
        if (dewPoint < -5) { humVibe = "공기가 많이 건조해요 🏜️"; humColor = "#e0f2fe"; }
        else if (dewPoint < 5) { humVibe = "조금 건조한 느낌이에요 💨"; humColor = "#8fd3f4"; }
        else if (dewPoint < 10) { humVibe = "쾌적해서 편안해요 ✨"; humColor = "#98ff98"; }
        else if (dewPoint < 13) { humVibe = "상쾌한 느낌이에요 🌿"; humColor = "#bbf7d0"; }
        else if (dewPoint < 16) { humVibe = "공기가 살짝 눅눅하게 느껴져요 🌫️"; humColor = "#fde68a"; }
        else if (dewPoint < 18) { humVibe = "조금 끈적하게 느껴질 수 있어요 😅"; humColor = "#fbbf24"; }
        else if (dewPoint < 21) { humVibe = "습해서 조금 무겁게 느껴질 수 있어요 💧"; humColor = "#f97316"; }
        else if (dewPoint < 24) { humVibe = "답답하게 느껴질 수 있어요 🥵"; humColor = "#ef4444"; }
        else { humVibe = "숨이 답답할 만큼 습해요… 조금 힘들 수 있어요 🌊🥵"; humColor = "#dc2626"; }

        // --- WIND FEELING ---
        let windFeeling, windFeelingColor;
        if (realFeel <= -10) {
    windFeeling = "숨이 아플 만큼 추워요… 꼭 따뜻하게 입어요 🥶";
    windFeelingColor = "#a5f3fc";
} else if (realFeel <= 0) {
    windFeeling = "꽁꽁 얼 것 같아요 ❄️";
    windFeelingColor = "#8fd3f4";
} else if (realFeel <= 8) {
    windFeeling = "차가운 공기가 살짝 아파요 🥶";
    windFeelingColor = "#bfdbfe";
} else if (realFeel <= 14) {
    windFeeling = "조금 쌀쌀해서 외투가 필요해요 🧊";
    windFeelingColor = "#c7d2fe";
} else if (realFeel <= 20) {
    windFeeling = "선선하고 기분 좋은 공기예요 🍃";
    windFeelingColor = "#bbf7d0";
} else if (realFeel <= 25) {
    windFeeling = "딱 좋은 날씨… 편안해요 ✨";
    windFeelingColor = "#98ff98";
} else if (realFeel <= 30) {
    windFeeling = "따뜻해서 기분이 풀리는 느낌이에요 🌤️";
    windFeelingColor = "#fde68a";
} else if (realFeel <= 35) {
    windFeeling = "조금 덥고 끈적할 수 있어요 🌡️";
    windFeelingColor = "#fbbf24";
} else if (realFeel <= 40) {
    windFeeling = "많이 더워요… 무리하지 말아요 🔥";
    windFeelingColor = "#f97316";
} else {
    windFeeling = "숨이 막힐 만큼 더워요… 꼭 쉬어가요 ☀️🔥";
    windFeelingColor = "#ef4444";
}
        
        // --- MOON PHASE ---
        const moonPhaseRaw = todayAstro.moon_phase;
        const moonMap = {
    "New Moon":         { emoji: "🌑", korean: "신월" },
    "Waxing Crescent":  { emoji: "🌒", korean: "초승달" },
    "First Quarter":    { emoji: "🌓", korean: "상현달" },
    "Waxing Gibbous":   { emoji: "🌔", korean: "차오르는 달" },
    "Full Moon":        { emoji: "🌕", korean: "보름달" },
    "Waning Gibbous":   { emoji: "🌖", korean: "기우는 달" },
    "Last Quarter":     { emoji: "🌗", korean: "하현달" },
    "Waning Crescent":  { emoji: "🌘", korean: "그믐달" },
};
const moonData = moonMap[moonPhaseRaw] || { emoji: "🌑", korean: moonPhaseRaw };
const moonEmoji = moonData.emoji;
const phaseName = moonData.korean;

        // --- OUTFIT ---
        let outfit = "편하게 입어도 괜찮아요", emo = "👕", mot = "motion-float";
        if (conditionCode >= 1087 && conditionCode <= 1282 && conditionText.toLowerCase().includes("thunder")) {
            outfit = "오늘은 밖에 나가지 않는 게 좋아요!"; emo = "⚡"; mot = "motion-storm";
        } else if (conditionCode >= 1180 && conditionCode <= 1282) {
            outfit = "비가 와요 우산 꼭 챙겨요"; emo = "☔"; mot = "motion-rain";
        } else if (temp < 12) {
            outfit = "쌀쌀해요 따뜻하게 입어요"; emo = "🧥"; mot = "motion-shiver";
        } else if (temp > 28) {
            outfit = "더워요 가볍게 입는 게 좋아요"; emo = "🩳"; mot = "motion-bounce";
        }

        // --- GIF ICON ---
        const isRain = conditionCode >= 1180 && conditionCode <= 1201;
        const isDrizzle = conditionCode >= 1150 && conditionCode <= 1171;
        const isSnow = conditionCode >= 1210 && conditionCode <= 1282 && !conditionText.toLowerCase().includes("thunder");
        const isThunder = conditionCode === 1087 || (conditionCode >= 1273 && conditionCode <= 1282);
        const isSleet = conditionCode >= 1204 && conditionCode <= 1207;
        const isHail = conditionCode >= 1237 || conditionCode === 1261 || conditionCode === 1264;
        const isFog = conditionCode === 1135 || conditionCode === 1147;
        const isBlizzard = conditionCode === 1117;
        const isOvercast = conditionCode === 1009;
        const isCloudy = conditionCode >= 1003 && conditionCode <= 1030;

        let gif;
        if (isThunder) gif = "Strom.gif";
        else if (isBlizzard) gif = "blizzard.png";
        else if (isSnow) gif = "snow.png";
        else if (isHail) gif = "hail.gif";
        else if (isSleet) gif = "sleet.png";
        else if (isRain || isDrizzle) gif = isDay ? "rain day.png" : "rain.png";
        else if (isFog) gif = "fog.png";
        else if (isOvercast) gif = "Cloudy_overcast.png";
        else if (isCloudy) gif = isDay ? "cloudy day.png" : "cloudy night.png";
        else gif = isDay ? "sunny.png" : "moon.gif";

        // --- UV LABEL ---
     let uvLabel;

if (uvIndex <= 0) {
    uvLabel = "자외선이 거의 없어요";
}
else if (uvIndex <= 2) {
    uvLabel = "자외선이 약해서 괜찮아요";
}
else if (uvIndex <= 5) {
    uvLabel = "적당한 수준이에요";
}
else if (uvIndex <= 7) {
    uvLabel = "자외선이 꽤 강해요… 조금 주의해요";
}
else if (uvIndex <= 10) {
    uvLabel = "자외선이 많이 강해요… 피부 보호해요";
}
else {
    uvLabel = "자외선이 매우 위험해요… 꼭 조심해요";
}

        // --- AQI ---
        const aqi = data.current.air_quality ? data.current.air_quality['us-epa-index'] : null;
        let aqiLabel, aqiColor;
        if (!aqi)           { aqiLabel = "N/A";                                    aqiColor = "#ffffff"; }
else if (aqi === 1) { aqiLabel = "공기가 아주 깨끗해요 🟢";               aqiColor = "#98ff98"; }
else if (aqi === 2) { aqiLabel = "보통이에요 🟡";                          aqiColor = "#fde68a"; }
else if (aqi === 3) { aqiLabel = "민감군은 주의해요 🟠";                   aqiColor = "#fbbf24"; }
else if (aqi === 4) { aqiLabel = "공기가 좋지 않아요 조심해요 🔴";       aqiColor = "#f97316"; }
else if (aqi === 5) { aqiLabel = "많이 나빠요 외출은 피하는 게 좋아요 🟣"; aqiColor = "#c084fc"; }
else                { aqiLabel = "위험한 수준이에요 꼭 주의해요 ⚫";       aqiColor = "#ef4444"; }
        

        // --- VISIBILITY ---
        let visLabel, visColor;
        if (visKm >= 10) { visLabel = "시야가 맑고 아주 깨끗해요 😎"; visColor = "#98ff98"; }
        else if (visKm >= 5) { visLabel = "잘 보이는 편이에요 👍"; visColor = "#bbf7d0"; }
        else if (visKm >= 2) { visLabel = "조금 흐릿하게 보여요 🌫️"; visColor = "#fde68a"; }
        else if (visKm >= 1) { visLabel = "앞이 잘 안 보여요… 😶‍🌫️"; visColor = "#f97316"; }
        else { visLabel = "시야가 많이 안 좋아요 주의해요 ⚠️"; visColor = "#ef4444"; }

        // --- PRESSURE ---
        let pressureStatus, pressureColor;
        if (pressureHpa < 980) { pressureStatus = "기압이 매우 낮아요… 날씨가 불안정해요 ⛈️"; pressureColor = "#ef4444"; }
        else if (pressureHpa < 1000) { pressureStatus = "기압이 낮아서 날씨가 흐릴 수 있어요 🌧️"; pressureColor = "#f97316"; }
        else if (pressureHpa < 1013) { pressureStatus = "조금 낮은 상태예요 🌥️"; pressureColor = "#fde68a"; }
        else if (pressureHpa < 1020) { pressureStatus = "안정된 상태라 편안해요 ✅"; pressureColor = "#98ff98"; }
        else if (pressureHpa < 1030) { pressureStatus = "맑은 날씨가 이어질 것 같아요 ☀️"; pressureColor = "#bbf7d0"; }
        else { pressureStatus = "공기가 건조하고 맑아요 🌤️"; pressureColor = "#8fd3f4"; }

        // --- WEATHER ALERTS ---
        const alertBanner = document.getElementById('alertBanner');
        const alertText = document.getElementById('alertText');
        let showAlert = false;
        let alertMsg = "";

        if (isThunder) { showAlert = true; alertMsg = "⚡ 천둥번개가 있어요 밖에서는 조심해요!"; }
        else if (isBlizzard) { showAlert = true; alertMsg = "🌨️ 눈보라가 심해요… 이동은 피하는 게 좋아요!"; }
        else if (isHail) { showAlert = true; alertMsg = "🌨️ 우박이 내려요… 실내에 있는 게 안전해요!"; }
        else if (windSpeedKmh > 60) { showAlert = true; alertMsg = "💨 바람이 많이 불어요— " + Math.round(windSpeedKmh) + " km/h 주의해요!"; }
        else if (uvIndex >= 8) { showAlert = true; alertMsg = "☀️ 자외선이 강해요… 피부 보호 꼭 해요!"; }
        else if (temp >= 38) { showAlert = true; alertMsg = "🔥 너무 더워요 물 자주 마시고 쉬어가요!"; }
        else if (temp <= -10) { showAlert = true; alertMsg = "🥶 너무 추워요 따뜻하게 꼭 챙겨 입어요!"; }

        if (alertBanner && alertText) {
            if (showAlert) {
                alertText.innerText = alertMsg;
                alertBanner.classList.remove('hidden');
            } else {
                alertBanner.classList.add('hidden');
            }
        }

        // --- UI UPDATES ---
        const displayCity = location.region ? `${location.name}, ${location.region}, ${location.country}` : `${location.name}, ${location.country}`;
document.getElementById('cityName').innerHTML = `<i class="fas fa-location-arrow"></i> ${displayCity}`;
        document.getElementById('temp').innerText = Math.round(temp) + "°C";
        const conditionMap = {
    "Sunny": "맑음", "Clear": "맑음", "Partly cloudy": "구름 조금", "Cloudy": "흐림",
    "Overcast": "완전 흐림", "Mist": "안개", "Fog": "짙은 안개", "Freezing fog": "결빙 안개",
    "Patchy rain possible": "비 올 수도 있어요", "Patchy snow possible": "눈 올 수도 있어요",
    "Blowing snow": "눈보라", "Blizzard": "강한 눈보라", "Thundery outbreaks possible": "천둥 가능",
    "Patchy light drizzle": "가벼운 이슬비", "Light drizzle": "이슬비", "Freezing drizzle": "결빙 이슬비",
    "Heavy freezing drizzle": "강한 결빙 이슬비", "Patchy light rain": "가벼운 비",
    "Light rain": "가벼운 비", "Moderate rain at times": "때때로 비", "Moderate rain": "보통 비",
    "Heavy rain at times": "때때로 강한 비", "Heavy rain": "강한 비",
    "Light freezing rain": "가벼운 결빙 비", "Moderate or heavy freezing rain": "강한 결빙 비",
    "Light sleet": "가벼운 진눈깨비", "Moderate or heavy sleet": "강한 진눈깨비",
    "Patchy light snow": "가벼운 눈", "Light snow": "가벼운 눈", "Patchy moderate snow": "보통 눈",
    "Moderate snow": "보통 눈", "Patchy heavy snow": "강한 눈", "Heavy snow": "강한 눈",
    "Ice pellets": "우박", "Light rain shower": "소나기", "Moderate or heavy rain shower": "강한 소나기",
    "Torrential rain shower": "폭우", "Light sleet showers": "가벼운 진눈깨비 소나기",
    "Light snow showers": "가벼운 눈 소나기", "Moderate or heavy snow showers": "강한 눈 소나기",
    "Light showers of ice pellets": "가벼운 우박", "Moderate or heavy showers of ice pellets": "강한 우박",
    "Thunderstorm": "천둥번개", "Patchy light rain with thunder": "천둥 동반 가벼운 비",
    "Moderate or heavy rain with thunder": "천둥 동반 강한 비",
    "Patchy light snow with thunder": "천둥 동반 가벼운 눈",
    "Moderate or heavy snow with thunder": "천둥 동반 강한 눈",
};
       
        document.getElementById('description').innerText = current.condition.text;
        document.getElementById('realFeelVal').innerText = `${realFeel.toFixed(1)}°C`;
        const realFeelCard = document.querySelector('#realFeelVal').closest('.vibe-card').querySelector('div');
let realFeelEmoji, realFeelMotion;

if (realFeel <= 0)       { realFeelEmoji = "🥶"; realFeelMotion = "motion-shiver"; }
else if (realFeel <= 8)  { realFeelEmoji = "🧊"; realFeelMotion = "motion-shiver"; }
else if (realFeel <= 14) { realFeelEmoji = "🍃"; realFeelMotion = "motion-sway"; }
else if (realFeel <= 20) { realFeelEmoji = "😌"; realFeelMotion = "motion-float"; }
else if (realFeel <= 25) { realFeelEmoji = "☀️"; realFeelMotion = "motion-bounce"; }
else if (realFeel <= 32) { realFeelEmoji = "🌡️"; realFeelMotion = "motion-bounce"; }
else                     { realFeelEmoji = "🔥"; realFeelMotion = "motion-storm"; }

realFeelCard.innerText = realFeelEmoji;
realFeelCard.className = realFeelMotion;

        document.getElementById('humidityVal').innerText = `${humidity}%`;
        const hStatus = document.getElementById('humidityStatus');
        if (hStatus) { hStatus.innerText = humVibe; hStatus.style.color = humColor; }

        document.getElementById('windVal').innerText = `${Math.round(windSpeedKmh)} km/h`;
        const wStatus = document.getElementById('windStatus');
        if (wStatus) { wStatus.innerText = windFeeling; wStatus.style.color = windFeelingColor; }

        document.getElementById('precipVal').innerText = `${precipChance}%`;
        document.getElementById('precipBarInner').style.width = `${precipChance}%`;

        // Pressure
        document.getElementById('pressureVal').innerText = `${pressureHpa} hPa`;
        const pressureStatusEl = document.getElementById('pressureStatus');
        if (pressureStatusEl) { pressureStatusEl.innerText = pressureStatus; pressureStatusEl.style.color = pressureColor; }

        // AQI & Visibility
        document.getElementById('aqiVal').innerText = aqi ? `Index ${aqi}` : "N/A";
        const aqiStatusEl = document.getElementById('aqiStatus');
        if (aqiStatusEl) { aqiStatusEl.innerText = aqiLabel; aqiStatusEl.style.color = aqiColor; }

        document.getElementById('visVal').innerText = `${visKm} km`;
        const visStatusEl = document.getElementById('visStatus');
        if (visStatusEl) { visStatusEl.innerText = visLabel; visStatusEl.style.color = visColor; }

        // Temp Bar
        document.getElementById('minTemp').innerText = Math.round(min) + "°";
        document.getElementById('maxTemp').innerText = Math.round(max) + "°";
        let range = max - min;
        let percent = (range <= 0) ? 50 : ((temp - min) / range) * 100;
        const marker = document.getElementById('tempMarker');
        const clamped = Math.min(Math.max(percent, 0), 100);
        marker.style.transition = "none";
        marker.style.left = "0%";
        marker.offsetHeight;
        marker.style.transition = "left 1s cubic-bezier(0.25, 1, 0.5, 1)";
        marker.style.left = `${clamped}%`;

        // Sunrise / Sunset
        document.getElementById('sunriseTime').innerText = todayAstro.sunrise;
        document.getElementById('sunsetTime').innerText = todayAstro.sunset;
        document.getElementById('sunriseIcon').className = "solar-sun animate-sunrise";
        document.getElementById('sunsetIcon').className = "solar-sun animate-sunset";

        // Moon
        const moonIconEl = document.getElementById('moonIcon');
        const moonTextEl = document.getElementById('moonPhaseText');
        if (moonIconEl) moonIconEl.innerText = moonEmoji;
        if (moonTextEl) moonTextEl.innerText = phaseName;

        // Outfit
        const eBox = document.getElementById('outfitEmoji');
        if (eBox) { eBox.innerText = emo; eBox.className = mot; }
        document.getElementById('outfitVal').innerText = outfit;

        // Stats
        document.getElementById('runVal').innerText =
    (temp > 12 && temp < 25 && !isRain)
    ? "뛰기 딱 좋아요 🏃‍♀️"
    : "오늘은 조금 피하는 게 좋아요";

document.getElementById('driveVal').innerText =
    (windSpeedKmh > 20 || isRain)
    ? "조심해서 운전해요 🚗"
    : "편하게 운전해도 괜찮아요";

document.getElementById('pollenVal').innerText =
    (isDay && conditionCode === 1000)
    ? "꽃가루가 많아요 🌼"
    : "괜찮은 수준이에요";

document.getElementById('uvVal').innerText = uvLabel;

        // Weather condition icon
        
        const iconEl = document.getElementById('mainWeatherIcon');
        const timeIconEl = document.getElementById('timeIcon');
 
        const hasConditionIcon = isThunder || isSnow || isHail || isSleet ||
                                  isRain || isDrizzle || isFog || isOvercast ||
                                  isCloudy || isBlizzard;
 
        if (hasConditionIcon) {
            // Special weather: condition icon center, sun/moon small on left
            iconEl.src = `assets/icons/${gif}`;
            iconEl.style.display = 'block';
 
            timeIconEl.src = isDay ? 'assets/icons/sunny.png' : 'assets/icons/moon.gif';
            timeIconEl.style.display = 'block';
        } else {
            // Clear day/night: sun or moon goes center (mainWeatherIcon), timeIcon hidden
            iconEl.src = isDay ? 'assets/icons/sunny.png' : 'assets/icons/moon.gif';
            iconEl.style.display = 'block';
 
            timeIconEl.style.display = 'none';
        }
        
        // Final Transitions
        updateDynamicBackground(localHour);
        if (clockInterval) clearInterval(clockInterval);
        clockInterval = updateLiveClock(tzId, temp);

        document.getElementById('portal').classList.add('hidden');
        document.getElementById('portalVideo').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('bgVideo').classList.remove('hidden');

        window.history.pushState({ page: "dashboard" }, "Weather", "");
        localStorage.setItem('lastVibe', JSON.stringify({ city: location.name, temp: Math.round(temp) + "°C" }));
        document.querySelectorAll('.vibe-card, .forecast-card, .hourly-card').forEach(card => {
           card.addEventListener('mouseenter', playHover);
});
        showHistory();

        // 🔊 Play ambient sound
if (isRain || isDrizzle || isThunder) {
  playAmbient('rain');
} else if (isSnow || isBlizzard || temp < 2) {
  playAmbient('winter');
} else if (isDay) {
  playAmbient('sunny');
} else {
  playAmbient('night');
}


        renderForecast(forecastDay);
        const allHours = [...forecastDay[0].hour, ...forecastDay[1].hour];
        renderHourly(allHours, location.localtime);

    } catch (e) { console.error("Error:", e); alert("Something went wrong. Please try again."); }
}

// --- 5-DAY FORECAST ---

function renderForecast(forecastDay) {
    const container = document.getElementById('forecastContainer');
    if (!container) return;
    container.innerHTML = '';
 
    forecastDay.slice(1).forEach(day => {
        const dayName = new Date(day.date).toLocaleDateString('ko-KR', { weekday: 'short' });
        const icon = day.day.condition.icon;
        const maxT = Math.round(day.day.maxtemp_c);
        const minT = Math.round(day.day.mintemp_c);
        const rain = day.day.daily_chance_of_rain;
 
        container.innerHTML += `
            <div class="forecast-list-item">
                <span class="f-day">${dayName}</span>
                <img src="https:${icon}" style="width:28px; height:28px;">
                <span style="font-size: 0.7rem; opacity: 0.6; margin: 0 8px;">💧${rain}%</span>
                <span class="f-temps">${maxT}° <span>${minT}°</span></span>
            </div>`;
    });
}

// --- HOURLY FORECAST ---
function renderHourly(allHours, localTimeStr) {
    const container = document.getElementById('hourlyContainer');
    if (!container) return;
    container.innerHTML = '';

    // 1. Get the current time of the city we searched
    const currentLocalTime = new Date(localTimeStr);

    // 2. Filter for only the hours that are in the future
    const futureHours = allHours.filter(h => new Date(h.time) > currentLocalTime);

    // 3. Take the next 12 hours specifically
    const next12 = futureHours.slice(0, 12);

    next12.forEach(h => {
        const hTime = new Date(h.time);
        const hHour = hTime.getHours();
        const label = hHour === 0 ? "12AM" : hHour < 12 ? `${hHour}AM` : hHour === 12 ? "12PM" : `${hHour - 12}PM`;
        const icon = h.condition.icon;
        const hTemp = Math.round(h.temp_c);
        const rain = h.chance_of_rain;
        
        // Highlight rain if it's a threat
        const rainWarningStyle = rain > 40 ? "color: #ff9a9e; font-weight: bold; opacity: 1;" : "opacity: 0.6;";

        container.innerHTML += `
            <div class="hourly-card">
                <p class="hourly-time">${label}</p>
                <img src="https:${icon}" style="width:30px; height:30px;">
                <p class="hourly-temp">${hTemp}°</p>
                <p style="font-size:0.55rem; margin-top:2px; ${rainWarningStyle}">💧${rain}%</p>
            </div>`;
    });
}

// --- LISTENERS ---
document.getElementById('searchBtn').onclick = () => {
    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => {});
    const city = document.getElementById('cityInput').value.trim();
    if (city) getVibe(city);
};
document.getElementById('cityInput').onkeydown = (e) => {
    if (e.key === 'Enter') getVibe(e.target.value.trim());
};
document.getElementById('backBtn').onclick = () => {
    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => {});
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('bgVideo').classList.add('hidden');
    document.getElementById('portal').classList.remove('hidden');
    document.getElementById('portalVideo').classList.remove('hidden');
};
document.getElementById('lastCity').onclick = () => {
    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => {});
    const saved = localStorage.getItem('lastVibe');
    if (saved) {
        const d = JSON.parse(saved);
        getVibe(d.city);
    }
};
document.getElementById('geoBtn').onclick = () => {
    const btn = document.getElementById('geoBtn');

    if (!navigator.geolocation) {
        alert('이 브라우저는 위치 서비스를 지원하지 않아요.');
        return;
    }

    // Show loading state
    btn.innerText = '📍 위치 찾는 중...';
    btn.disabled = true;
    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => {});

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            // Success — pass lat,lon directly to getVibe (WeatherAPI accepts coordinates)
            const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
            btn.innerText = '📍 내 위치 날씨 보기';
            btn.disabled = false;
            getVibe(coords);
        },
        (err) => {
            // Error
            btn.innerText = '📍 내 위치 날씨 보기';
            btn.disabled = false;
            if (err.code === 1) {
                alert('위치 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요.');
            } else {
                alert('위치를 가져오지 못했어요. 다시 시도해 주세요.');
            }
        },
        { timeout: 10000, maximumAge: 60000 }
    );
};
// --- SHARE WEATHER ---
document.getElementById('shareBtn').onclick = async () => {
    const city = document.getElementById('cityName').innerText.replace(/[^\w\s,가-힣]/g, '').trim();
    const temp = document.getElementById('temp').innerText;
    const desc = document.getElementById('description').innerText;
    const feel = document.getElementById('realFeelVal').innerText;
    const humidity = document.getElementById('humidityVal').innerText;
    const wind = document.getElementById('windVal').innerText;

    const shareText = `🌤️ ${city} 날씨\n🌡️ ${temp} — ${desc}\n🤔 체감온도: ${feel}\n💧 습도: ${humidity}\n💨 바람: ${wind}\n\nVibeWeather Pro에서 확인했어요`;

    if (navigator.share) {
        await navigator.share({ title: 'VibeWeather Pro', text: shareText });
    } else {
        navigator.clipboard.writeText(shareText);
        const btn = document.getElementById('shareBtn');
        btn.innerText = '✅ 클립보드에 복사됐어요!';
        setTimeout(() => btn.innerText = '📤 날씨 공유하기', 2000);
    }
};


function initializeDefaultDate() {
    const seoulDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const dateEl = document.getElementById('todayDate');
    if(dateEl) dateEl.innerText = seoulDate.toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

initializeDefaultDate();
