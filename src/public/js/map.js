import { add_listeners, create_node, disable_element } from "./dom.js";
import { request, option, debounce } from "./utils.js";

const geo_trigger = document.querySelector(".js-geo-trigger");
const geo_input = document.querySelector(".js-geo-input");
const predictions = document.querySelector(".js-suggestions");
const location_input_container = document.querySelector(".js-location-input-container");
const location_input = document.querySelector(".js-location");

function get_map_container() {
  const map = document.getElementById("map");
  if (map) return map;
  const node = create_node("div", { class: "h-72 w-full", id: "map" });
  location_input_container.insertAdjacentElement("afterend", node);
  return node;
}

let map = null;
let marker = null;

async function init_map({ lat, lng }) {
  const { Loader } = await import("/node_modules/@googlemaps/js-api-loader/dist/index.esm.js");
  const loader = new Loader({
    apiKey: "AIzaSyCOBscE5wKHhTlQBx20mKN5-abTzLzn3P4",
    version: "weekly",
    region: "uz",
  });

  const google = await loader.load();
  const pos = new google.maps.LatLng(lat, lng);

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
    const lat = marker.getPosition().lat();
    const lng = marker.getPosition().lng();
    const [result, err] = await option(request(`/geo/geocode?lat=${lat}&lon=${lng}`));
    if (err) return;
    const pos = new google.maps.LatLng(result.coords.lat, result.coords.lon);
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
      const enable = disable_element(e.target);
      await init_map({ lat: coords.latitude, lng: coords.longitude }).catch(() => enable());
      enable();
    } else {
      const pos = { lat: coords.latitude, lng: coords.longitude };
      marker.setPosition(pos);
      map.panTo(pos);
      map.setCenter(pos);
    }
    const [result, err] = await option(
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
  const form = e.target.form;
  const resource = new URL(form.action);
  resource.search = new URLSearchParams(new FormData(form));

  const [results, err] = await option(request(resource));
  predictions.innerHTML = "";
  predictions.classList.add("!opacity-100", "!translate-y-0", "!z-10");
  for (const result of results) {
    const li = create_node("li");
    const input = create_node("input", {
      type: "radio",
      name: "loc",
      id: `location-${result.district_id}`,
      value: `${result.district_id},${result.region_id}`,
      class: "absolute opacity-0 w-0 -z-10 peer",
    });
    const label = create_node("label", {
      for: `location-${result.district_id}`,
      class:
        "text-gray-900 block p-2.5 hover:bg-gray-50 duration-200 peer-checked:bg-gray-50 dark:text-gray-200 hover:bg-zinc-800",
    });
    label.textContent = result.formatted_address;

    input.addEventListener("change", async () => {
      geo_input.value = result.formatted_address;
      predictions.classList.remove("!opacity-100", "!translate-y-0", "!z-10");
      if (!map) await init_map({ lat: result.coords.lat, lng: result.coords.lon });
      else {
        const pos = { lat: result.coords.lat, lng: result.coords.lon };
        marker.setPosition(pos);
        map.panTo(pos);
        map.setCenter(pos);
      }

      location_input.value = `${result.formatted_address}|${result.coords.lat}|${result.coords.lon}|${result.district_id}|${result.region_id}`;
    });
    li.append(input, label);

    predictions.append(li);
  }
}

add_listeners(geo_input, {
  input: debounce(on_geo_input_change),
});

add_listeners(geo_trigger, {
  click: on_geo_trigger,
});

window.addEventListener("load", async () => {
  const location = location_input.value;
  if (location) {
    const [formatted_address, lat, lng] = location.split("|");
    await init_map({ lat, lng });
  }
});
