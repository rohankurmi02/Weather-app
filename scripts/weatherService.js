// Weather API Configuration
const weatherConfig = {
    API_KEY: '346b18a11f773d93dcd1894f184d89bd',
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    cache: {},
    cacheDuration: {
        current: 600000, // 10 minutes for current weather
        forecast: 1800000 // 30 minutes for forecasts
    }
};

// Fetch weather by city name
function fetchWeatherByCity(city) {
    const cacheKey = `city_${city.toLowerCase()}`;
    
    // Check cache first
    if (weatherConfig.cache[cacheKey] && 
        Date.now() - weatherConfig.cache[cacheKey].timestamp < weatherConfig.cacheDuration.current) {
        return Promise.resolve(weatherConfig.cache[cacheKey].data);
    }

    return fetch(`${weatherConfig.BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${weatherConfig.API_KEY}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'City not found');
                });
            }
            return response.json();
        })
        .then(data => {
            weatherConfig.cache[cacheKey] = {
                data: data,
                timestamp: Date.now()
            };
            return data;
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            throw error;
        });
}

// Fetch weather by coordinates
function fetchWeatherByCoords(lat, lon) {
    const cacheKey = `coord_${lat}_${lon}`;
    
    // Check cache first
    if (weatherConfig.cache[cacheKey] && 
        Date.now() - weatherConfig.cache[cacheKey].timestamp < weatherConfig.cacheDuration.current) {
        return Promise.resolve(weatherConfig.cache[cacheKey].data);
    }

    return fetch(`${weatherConfig.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherConfig.API_KEY}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Location not found');
                });
            }
            return response.json();
        })
        .then(data => {
            weatherConfig.cache[cacheKey] = {
                data: data,
                timestamp: Date.now()
            };
            return data;
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            throw error;
        });
}

// Fetch forecast data
function fetchForecast(lat, lon) {
    const cacheKey = `forecast_${lat}_${lon}`;
    
    // Check cache first
    if (weatherConfig.cache[cacheKey] && 
        Date.now() - weatherConfig.cache[cacheKey].timestamp < weatherConfig.cacheDuration.forecast) {
        return Promise.resolve(weatherConfig.cache[cacheKey].data);
    }

    return fetch(`${weatherConfig.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${weatherConfig.API_KEY}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Forecast not available');
                });
            }
            return response.json();
        })
        .then(data => {
            weatherConfig.cache[cacheKey] = {
                data: data,
                timestamp: Date.now()
            };
            return data;
        })
        .catch(error => {
            console.error('Error fetching forecast:', error);
            throw error;
        });
}

// Get weather icon class
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'fas fa-sun text-yellow-400',
        '01n': 'fas fa-moon text-gray-300',
        '02d': 'fas fa-cloud-sun text-yellow-300',
        '02n': 'fas fa-cloud-moon text-gray-400',
        '03d': 'fas fa-cloud text-gray-400',
        '03n': 'fas fa-cloud text-gray-500',
        '04d': 'fas fa-cloud-meatball text-gray-500',
        '04n': 'fas fa-cloud-meatball text-gray-600',
        '09d': 'fas fa-cloud-rain text-blue-400',
        '09n': 'fas fa-cloud-rain text-blue-500',
        '10d': 'fas fa-cloud-sun-rain text-blue-300',
        '10n': 'fas fa-cloud-moon-rain text-blue-400',
        '11d': 'fas fa-bolt text-yellow-500',
        '11n': 'fas fa-bolt text-yellow-600',
        '13d': 'fas fa-snowflake text-blue-200',
        '13n': 'fas fa-snowflake text-blue-300',
        '50d': 'fas fa-smog text-gray-400',
        '50n': 'fas fa-smog text-gray-500'
    };
    return iconMap[iconCode] || 'fas fa-question text-gray-400';
}