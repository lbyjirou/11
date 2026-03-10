const regionData = require('./region-data')

function getProvinces() {
  return regionData.map(p => p.name)
}

function getCities(provinceIdx) {
  const province = regionData[provinceIdx]
  return province ? province.cities.map(c => c.name) : []
}

function getDistricts(provinceIdx, cityIdx) {
  const province = regionData[provinceIdx]
  if (!province) return []
  const city = province.cities[cityIdx]
  return city ? city.districts : []
}

function buildPickerRange(provinceIdx, cityIdx) {
  return [getProvinces(), getCities(provinceIdx), getDistricts(provinceIdx, cityIdx)]
}

function normalizeCityName(name) {
  if (!name) return ''
  return name.replace(/市$/, '')
}

function findIndexesByCity(cityName) {
  if (!cityName) return null
  const normalized = cityName.replace(/市$/, '')
  for (let pi = 0; pi < regionData.length; pi++) {
    const province = regionData[pi]
    for (let ci = 0; ci < province.cities.length; ci++) {
      const city = province.cities[ci]
      const cn = city.name.replace(/市$/, '')
      if (cn === normalized || city.name === cityName) {
        return { provinceIdx: pi, cityIdx: ci, districtIdx: 0 }
      }
    }
  }
  return null
}

function searchCities(keyword, limit) {
  if (!keyword) return []
  limit = limit || 10
  const results = []
  for (let pi = 0; pi < regionData.length; pi++) {
    const province = regionData[pi]
    for (let ci = 0; ci < province.cities.length; ci++) {
      const city = province.cities[ci]
      if (city.name.includes(keyword) || normalizeCityName(city.name).includes(keyword)) {
        results.push({
          province: province.name, city: city.name,
          provinceIdx: pi, cityIdx: ci,
          label: province.name + ' ' + city.name
        })
        if (results.length >= limit) return results
      }
    }
  }
  return results
}

module.exports = {
  getProvinces,
  getCities,
  getDistricts,
  buildPickerRange,
  normalizeCityName,
  findIndexesByCity,
  searchCities
}
