import { disable_element } from "./dom.js";
import { div, listeners, li, input, label, add_listeners } from "dom";
import { request, option, debounce } from "./utils.js";
import { maskit } from "./mask.js";

let masked_input = document.querySelector(".js-masked-input");
let geo_trigger = document.querySelector(".js-geo-trigger");
let geo_input = document.querySelector(".js-geo-input");
let predictions = document.querySelector(".js-suggestions");
let location_input_container = document.querySelector(".js-location-input-container");
let location_input = document.querySelector(".js-location");

function get_map_container() {
  let map = document.getElementById("map");
  if (map) return map;
  let node = div({ class: "h-72 w-full", id: "map" })
  location_input_container.insertAdjacentElement("afterend", node);
  return node;
}

let map = null;
let marker = null;

async function init_map({ lat, lng }) {
  let { Loader } = await import("/node_modules/@googlemaps/js-api-loader/dist/index.esm.js");
  let loader = new Loader({
    apiKey: "AIzaSyCOBscE5wKHhTlQBx20mKN5-abTzLzn3P4",
    version: "weekly",
    region: "uz",
  });

  let google = await loader.load();
  let pos = new google.maps.LatLng(lat, lng);

  map = new google.maps.Map(get_map_container(), {
    center: pos,
    zoom: 15,
    mapTypeId: "roadmap",
    disableDefaultUI: true,
    zoomControl: true,
    mapId: "a245b8cd3728c3c7",
  });

  marker = new google.maps.Marker({
    position: pos,
    map,
    draggable: true,
  });

  marker.addListener("dragend", async () => {
    let lat = marker.getPosition().lat();
    let lng = marker.getPosition().lng();
    let [result, err] = await option(request(`/geo/geocode?lat=${lat}&lon=${lng}`));
    if (err) return;
    let pos = new google.maps.LatLng(result.coords.lat, result.coords.lon);
    marker.setPosition(pos);
    map.panTo(pos);
    map.setCenter(pos);
    geo_input.value = result.formatted_address;
    location_input.value = `${result.formatted_address}|${lat}|${lng}|${result.district_id}|${result.region_id}`;
  });

  return map;
}

function on_geo_trigger(e) {
  if (!("geolocation" in window.navigator)) {
    disable_element(e.target);
    return;
  }

  async function on_success({ coords }) {
    if (!map) {
      let enable = disable_element(e.target);
      await init_map({ lat: coords.latitude, lng: coords.longitude }).catch(() => enable());
      enable();
    } else {
      let pos = { lat: coords.latitude, lng: coords.longitude };
      marker.setPosition(pos);
      map.panTo(pos);
      map.setCenter(pos);
    }
    let [result, err] = await option(
      request(`/geo/geocode?lat=${coords.latitude}&lon=${coords.longitude}`)
    );
    if (err) return;
    geo_input.value = result.formatted_address;
    location_input.value = `${result.formatted_address}|${coords.latitude}|${coords.longitude}|${result.district_id}|${result.region_id}`;
  }

  window.navigator.geolocation.getCurrentPosition(on_success, console.error, {
    enableHighAccuracy: true,
  });
}

async function on_geo_input_change(e) {
  if (!e.target.checkValidity()) return;
  let form = e.target.form;
  let resource = new URL(form.action);
  resource.search = new URLSearchParams(new FormData(form));

  let [results, err] = await option(request(resource));
  predictions.innerHTML = "";
  predictions.classList.add("!opacity-100", "!translate-y-0", "!z-10");
  for (let result of results) {
    let prediction = li(
      input({
        type: "radio",
        name: "loc",
        id: `location-${result.district_id}`,
        value: `${result.district_id},${result.region_id}`,
        class: "absolute opacity-0 w-0 -z-10 peer"
      },
        listeners({
          change: async () => {
            geo_input.value = result.formatted_address;
            predictions.classList.remove("!opacity-100", "!translate-y-0", "!z-10");
            if (!map) await init_map({ lat: result.coords.lat, lng: result.coords.lon });
            else {
              let pos = { lat: result.coords.lat, lng: result.coords.lon };
              marker.setPosition(pos);
              map.panTo(pos);
              map.setCenter(pos);
            }

            location_input.value = `${result.formatted_address}|${result.coords.lat}|${result.coords.lon}|${result.district_id}|${result.region_id}`;
          }
        })),
      label({
        for: `location-${result.district_id}`,
        class:
          "text-gray-900 block p-2.5 hover:bg-gray-50 duration-200 peer-checked:bg-gray-50 dark:text-gray-200 dark:hover:bg-zinc-800",
      }, result.formatted_address)
    )
    predictions.append(prediction);
  }
}

function on_masked_input(e) {
  let mask = e.target.dataset.mask;
  let unmask = e.target.dataset.unmask;
  e.target.value = maskit(maskit(e.target.value, unmask), mask);
}

add_listeners(geo_input, {
  input: debounce(on_geo_input_change),
});

add_listeners(geo_trigger, {
  click: on_geo_trigger,
});

add_listeners(masked_input, {
  input: on_masked_input,
});

window.addEventListener("load", async () => {
  let location = location_input.value;
  if (masked_input) {
    masked_input.value = maskit(masked_input.value, masked_input.dataset.mask);
  }
  if (location) {
    let [formatted_address, lat, lng] = location.split("|");
    await init_map({ lat, lng });
  }
});
