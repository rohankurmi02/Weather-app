// Main Application
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        cityInput: document.getElementById('cityInput'),
        searchBtn: document.getElementById('searchBtn'),
        currentLocationBtn: document.getElementById('currentLocationBtn'),
        recentSearches: document.getElementById('recentSearches'),
        currentWeather: document.getElementById('currentWeather'),
        forecastContainer: document.getElementById('forecastContainer'),
        errorMessage: document.getElementById('errorMessage'),
        currentCity: document.getElementById('currentCity'),
        currentDate: document.getElementById('currentDate'),
        weatherIcon: document.getElementById('weatherIcon'),
        currentTemp: document.getElementById('currentTemp'),
        weatherDescription: document.getElementById('weatherDescription'),
        windSpeed: document.getElementById('windSpeed'),
        humidity: document.getElementById('humidity'),
        forecast: document.getElementById('forecast')
    };

    // Verify all elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Element ${key} not found`);
            return;
        }
    }

    // Recent searches from localStorage
    let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

    // Initialize the app
    if (recentCities.length > 0) {
        loadWeather(recentCities[0]);
    }

    // Event Listeners
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.cityInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') handleSearch();
    });
    elements.cityInput.addEventListener('input', showRecentSearches);
    elements.currentLocationBtn.addEventListener('click', getCurrentLocation);

    // Handle search
    function handleSearch() {
        const city = elements.cityInput.value.trim();
        
        if (!city) {
            showError('Please enter a city name');
            return;
        }

        loadWeather(city)
            .then(() => {
                addToRecentSearches(city);
                elements.cityInput.value = '';
                elements.recentSearches.classList.add('hidden');
            })
            .catch(error => {
                showError(error.message);
            });
    }

    // Load weather for a city
    function loadWeather(city) {
        hideError();
        showLoading();

        return fetchWeatherByCity(city)
            .then(weatherData => {
                displayCurrentWeather(weatherData);
                return fetchForecast(weatherData.coord.lat, weatherData.coord.lon);
            })
            .then(forecastData => {
                displayForecast(forecastData);
            })
            .catch(error => {
                showError(error.message || 'Failed to load weather data');
                throw error;
            });
    }

    // Display current weather
    function displayCurrentWeather(data) {
        // Create new content instead of updating individual elements
        const currentWeatherHTML = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold text-gray-800" id="currentCity">${data.name}, ${data.sys?.country || ''}</h2>
                <span class="text-gray-500" id="currentDate">${new Date(data.dt * 1000).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</span>
            </div>
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="${getWeatherIcon(data.weather[0].icon)} text-5xl mr-4"></div>
                    <div>
                        <span class="text-4xl font-bold" id="currentTemp">${Math.round(data.main.temp)}°C</span>
                        <span class="block text-gray-600 capitalize" id="weatherDescription">${data.weather[0].description}</span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-gray-600"><i class="fas fa-wind mr-2"></i><span id="windSpeed">${data.wind.speed.toFixed(1)}</span> km/h</div>
                    <div class="text-gray-600"><i class="fas fa-tint mr-2"></i><span id="humidity">${data.main.humidity}</span>%</div>
                </div>
            </div>
        `;
    
        const currentWeatherEl = document.getElementById('currentWeather');
        currentWeatherEl.innerHTML = currentWeatherHTML;
        currentWeatherEl.classList.remove('hidden');
    }

    // Display 5-day forecast
    function displayForecast(data) {
        elements.forecast.innerHTML = '';

        // Group by day (API returns 3-hour intervals, we want daily)
        const dailyForecasts = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = item;
            }
        });

        // Get the next 5 days
        const forecastDays = Object.values(dailyForecasts).slice(1, 6);

        forecastDays.forEach(day => {
            const date = new Date(day.dt * 1000).toLocaleDateString('en-US', {
                weekday: 'short'
            });

            const dayElement = document.createElement('div');
            dayElement.className = 'bg-white rounded-lg shadow p-4 flex items-center justify-between';
            dayElement.innerHTML = `
                <div class="flex items-center">
                    <span class="font-medium text-gray-700 w-16">${date}</span>
                    <i class="${getWeatherIcon(day.weather[0].icon)} text-2xl mx-4 text-blue-500"></i>
                    <span class="text-gray-600">${day.weather[0].description}</span>
                </div>
                <div class="text-right">
                    <span class="font-bold">${Math.round(day.main.temp)}°C</span>
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span><i class="fas fa-wind mr-1"></i> ${day.wind.speed.toFixed(1)} km/h</span>
                        <span class="ml-2"><i class="fas fa-tint mr-1"></i> ${day.main.humidity}%</span>
                    </div>
                </div>
            `;
            elements.forecast.appendChild(dayElement);
        });

        elements.forecastContainer.classList.remove('hidden');
    }

    // Get current location
    function getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    hideError();
                    showLoading();

                    const { latitude, longitude } = position.coords;
                    fetchWeatherByCoords(latitude, longitude)
                        .then(weatherData => {
                            displayCurrentWeather(weatherData);
                            addToRecentSearches(weatherData.name);
                            return fetchForecast(latitude, longitude);
                        })
                        .then(forecastData => {
                            displayForecast(forecastData);
                        })
                        .catch(error => {
                            showError(error.message || 'Failed to get weather for your location');
                        });
                },
                (error) => {
                    showError('Geolocation error: ' + error.message);
                }
            );
        } else {
            showError('Geolocation is not supported by your browser');
        }
    }

    // Recent searches functionality
    function addToRecentSearches(city) {
        // Remove if already exists
        recentCities = recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());
        
        // Add to beginning
        recentCities.unshift(city);
        
        // Keep only last 5 searches
        if (recentCities.length > 5) {
            recentCities.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
    }

    function showRecentSearches() {
        if (elements.cityInput.value === '' && recentCities.length > 0) {
            elements.recentSearches.innerHTML = recentCities.map(city => `
                <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer">${city}</div>
            `).join('');
            
            // Add click handlers
            Array.from(elements.recentSearches.children).forEach((item, index) => {
                item.addEventListener('click', () => {
                    elements.cityInput.value = recentCities[index];
                    handleSearch();
                });
            });
            
            elements.recentSearches.classList.remove('hidden');
        } else {
            elements.recentSearches.classList.add('hidden');
        }
    }

    // Error handling
    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorMessage.classList.remove('hidden');
        elements.currentWeather.classList.add('hidden');
        elements.forecastContainer.classList.add('hidden');
    }

    function hideError() {
        elements.errorMessage.classList.add('hidden');
    }

    function showLoading() {
        elements.currentWeather.innerHTML = `
            <div class="flex justify-center items-center h-32">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        `;
        elements.currentWeather.classList.remove('hidden');
        elements.forecastContainer.classList.add('hidden');
    }
});