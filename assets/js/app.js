const api_key = "4d29328666660d90b5ac4db050a745be";

// const api_key = "20fdfb76008f0d97399a7057b61972e9";

         const fetchData = function(URL, callback){
            fetch(`${URL}&appid=${api_key}`)
            .then(res => res.json())
            .then(data => callback(data));
        }

         const url = {
            currentWeather(lat, lon){
                return 
                `https://api.openweathermap.org/data/2.5/weather?${lat}&${lon}&units=metric`
            },
            forecast(lat, lon){
                return 
                `https://api.openweathermap.org/data/2.5/forecast?${lat}&${lon}&units=metric`
            },
            airPollution(lat, lon){
                return
                `http://api.openweathermap.org/data/2.5/air_pollution?${lat}&${lon}`
            },
            reverseGeo(lat, lon){
                return 
                `http://api.openweathermap.org/geo/1.0/reverse?${lat}&${lon}&limit=5`
            },
            geo(query){
                return
                `http://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5`
            }
        }

         const weekDayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];

         const monthName = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Des"
        ]

         const getDate = function(dateUnix, timezone){
            const date = new Date((dateUnix + timezone) * 1000);
            const weekDayNames = weekDayNames[date.getUTCDay()];
            const monthName = monthName[date.getUTCMonth()];
            return `${weekDayNames} ${date.getUTCDate()}, ${monthName}`
        }

         const getTime = function(timeUnix, timezone){
            const date = new Date((timeUnix + timezone) * 1000);
            const hours = date.getUTCHours();
            const minutes = date.getUTCMinutes();
            const period = hours >= 12 ? "PM" : "AM";
            return `${hours % 12 || 12}:${minutes} ${period}`
        }

         const getHours = function(timeUnix, timezone){
            const date = new Date((timeUnix + timezone) * 1000);
            const hours = date.getUTCHours();
            const period = hours >= 12 ? "PM" : "AM";
            return `${hours % 12 || 12} ${period}`
        }

         const mps_to_kmh = mps => {
            const mph = mps * 3600;
            return mph / 1000;
        }
        

         const aqiText = {
            1: {
                level: "Good",
                message: "Air quality is considerd satisfactory, and air pollution poses little or no risk."
            },
            2: {
                level: "Fair",
                message: "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a small number of people who are unusually sensitive to air pollution."
            },
            3: {
                level: "Moderate",
                message: "Members of sensitive groups may experience health effects the general public is not likely to be affected."
            },
            4: {
                level: "Poor",
                message: "Everyone may begin to experince health effectes; members of sensitive groups may experince more serious health effects."
            },
            5: {
                level: "Very Poor",
                message: "Health warnings of emergency conditions. The entire population is more likely to be affected."
            }
        }


        const defaultLocation = "#/weather?Lat=51.5073219&Lon=-0.1276474";


        const currentLocation = function (){
            window.navigator.geolocation.getCurrentPosition(res => {
                const {latitude, longitude} = res.coords;
                UpdateWeather(`lat=${latitude}`, `lon=${longitude}`)
            }, err =>{
                window.location.hash = defaultLocation;
            })
        }


        const SearchedLocation = query => UpdateWeather(...query.split("&"));
        //  UpdateWeather("Lat=51.5073219", "Lon=-0.1276474")

        const routes = new Map([
            ["/current-location", currentLocation],
            ["/weather", SearchedLocation]
        ])

        const checkHash = function() {
            const requestURL = window.location.hash.slice(1)
            const [route, query] = requestURL.includes ? requestURL.split("?") : [requestURL];
            routes.get(route) ? routes.get(route)(query) : error404();
        }

        window.addEventListener("hashchange", checkHash);

        window.addEventListener("load", function(){
            if(!window.location.hash){
                window.location.hash = "#/current-location"
            }else{
                checkHash();
            }
        });

        const addEventOnElements = function(elements, eventType, callback){
            for(const element of elements) element.addEventListener(eventType, callback);
        }

        const searchView = document.querySelector("[data-search-view]");
        const searchTogglers = document.querySelectorAll("[data-search-toggler]");
        const toggleSearch = () => searchView.classList.toggle("active");
        addEventOnElements(searchTogglers, "click", toggleSearch);

        const searchField = document.querySelector("[data-search-field]");
        const searchResult = document.querySelector("[data-search-result]");
        let searchTimeOut = null;
        const searchTimeOutDuration = 500;
        
        searchField.addEventListener("input", function(){
            searchTimeOut ?? clearTimeout(searchTimeOut);
            if(!searchField.value){
                searchResult.classList.remove("active");
                searchResult.innerHTML = "";
                searchField.classList.remove("searching")
            }else{
                searchField.classList.add("searching")
            }

            if(searchField.value){
                searchTimeOut = setTimeout(() =>{
                    fetchData(url.geo(searchField.value), function (locations){
                        searchField.classList.remove("searching");
                        searchResult.classList.add("active");
                        searchResult.innerHTML = `<ul class="view-list" data-search-list></ul>`
                    
                    const items = [];
                    for(const {name, lat, lon, country, state} of locations){
                        const searchItem = document.createElement("li");
                        searchItem.classList.add("view-item");
                        searchItem.innerHTML = `
                        <span class="m-icon">location_on</span>
                            <div>
                                <p class="item-title">${name}</p>
                                <p class="label-2 item-suptitle">${state || ""} ${country}</p>
                            </div>
                        <a href="#/weather?lat=${lat}&lon=${lon}" aria-label="${name} weather" class="item-link has-state" data-search-toggler></a>
                        `
                        searchResult.querySelector("[data-search-list]").appendChild(searchItem);
                        items.push(searchItem.querySelector("[data-search-toggler]"))
                    }
                    addEventOnElements(items, "click", function (){
                        toggleSearch();
                        searchResult.classList.remove("active");
                    })
                    });
                }, searchTimeOutDuration)
            }
        });

        const container = document.querySelector("[data-container]");
        const loading = document.querySelector("[data-loading]");
        const currentLocationBtn = document.querySelector("[data-current-location-btn]");
        const errorContent = document.querySelector("[data-error-content]");


        const updateWeather = function (lat, lon){
            loading.computedStyleMap.display = "grid";
            container.computedStyleMap.overflowY = "hidden";
            container.classList.contains("fade-in") ?? container.classList.remove("fade-in");
            errorContent.style.display = "none";

            const currentWeatherSection = document.querySelector("[data-current-weather]");
            const highlightsSection = document.querySelector("[data-highlights]");
            const hourlySection = document.querySelector("[data-hourly-forecast]");
            const forecastSection = document.querySelector("[data-5-day-forecast]");

            currentWeatherSection.innerHTML = "";
            highlightsSection.innerHTML = "";
            hourlySection.innerHTML = "";
            forecastSection.innerHTML = "";

            if(window.location.hash === "#/current-location"){
                currentLocationBtn.setAttribute("disabled", "")
            } else{
                currentLocationBtn.removeAttribute("disabled");
            }

            fetchData(url.currentWeather(lat, lon), function(currentWeather){
                const{
                    weather,
                    dt: dateUnix,
                    sys: {sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC},
                    main: {temp, fells_like, pressure, humidity},
                    visiblity,
                    timezone
                } = currentWeather
                const [{description, icon}] = weather;

                const card = document.createElement("div");
                card.classList.add("card", "card-lg", "current-weather-card");
                card.innerHTML = `
                <h2 class="title-2 card-title">Now</h2>
                    <div class="wrapper">
                    <p class="heading">${parseInt(temp)}°c</p>
                    <img src="assets/images/weather_icons/${icon}" width="64" height="64" alt="${description}" class="weather-icon">

                    </div>
                    <p class="body-3">${description}</p>
                <ul class="meta-list">
                        <li class="meta-item">
                            <span class="m-icon">calendar_today</span>
                            <p class="title-3 meta-text">${module.getDate(dateUnix, timezone)}</p>
                        </li>
                <li class="meta-item">
                        <span class="m-icon">location_on</span>
                        <p class="title-3 meta-text" data-location></p>
                </li>
                
                </ul>
                `;
                fetchData(url.reverseGeo(lat, lon), function([{name, country}]){
                    card.querySelector("[data-location]").innerHTML = `${name}, ${country}`
                });
                currentWeatherSection.appendChild(card);
            });

        }

        const error404 = function(){}