export function scan_profile_tmpl(profile) {
  return `<div class="shadow-xs py-4 px-8 bg-gray-50 text-center rounded-lg">
            <img src=${profile.profile_photo_url} class="w-32 h-32 object-cover rounded-full" />
            <span class="text-lg font-medium text-gray-900 block mt-2">${profile.name}</span>
          </div>`;
}
