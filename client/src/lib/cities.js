// Curated list of Indian cities for pickup/delivery selection.
// Covers all state/UT capitals, tier-1 metros, tier-2 cities, and major freight hubs.
// Each entry: { name, state, lat, lng }.
// Add new entries by inserting them in the relevant state block (alphabetical within state).

export const CITIES = [
  // Andhra Pradesh
  { name: 'Visakhapatnam',   state: 'Andhra Pradesh',  lat: 17.6868, lng: 83.2185 },
  { name: 'Vijayawada',      state: 'Andhra Pradesh',  lat: 16.5062, lng: 80.6480 },
  { name: 'Guntur',          state: 'Andhra Pradesh',  lat: 16.3067, lng: 80.4365 },
  { name: 'Nellore',         state: 'Andhra Pradesh',  lat: 14.4426, lng: 79.9865 },
  { name: 'Tirupati',        state: 'Andhra Pradesh',  lat: 13.6288, lng: 79.4192 },
  { name: 'Kurnool',         state: 'Andhra Pradesh',  lat: 15.8281, lng: 78.0373 },
  { name: 'Kakinada',        state: 'Andhra Pradesh',  lat: 16.9891, lng: 82.2475 },
  { name: 'Rajahmundry',     state: 'Andhra Pradesh',  lat: 17.0005, lng: 81.8040 },
  { name: 'Anantapur',       state: 'Andhra Pradesh',  lat: 14.6819, lng: 77.6006 },
  { name: 'Amaravati',       state: 'Andhra Pradesh',  lat: 16.5736, lng: 80.3570 },

  // Arunachal Pradesh
  { name: 'Itanagar',        state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053 },
  { name: 'Naharlagun',      state: 'Arunachal Pradesh', lat: 27.1043, lng: 93.6953 },
  { name: 'Pasighat',        state: 'Arunachal Pradesh', lat: 28.0667, lng: 95.3333 },
  { name: 'Tezu',            state: 'Arunachal Pradesh', lat: 27.9333, lng: 96.1667 },

  // Assam
  { name: 'Guwahati',        state: 'Assam',           lat: 26.1445, lng: 91.7362 },
  { name: 'Dibrugarh',       state: 'Assam',           lat: 27.4728, lng: 94.9120 },
  { name: 'Silchar',         state: 'Assam',           lat: 24.8333, lng: 92.7789 },
  { name: 'Jorhat',          state: 'Assam',           lat: 26.7509, lng: 94.2037 },
  { name: 'Tezpur',          state: 'Assam',           lat: 26.6528, lng: 92.7926 },

  // Bihar
  { name: 'Patna',           state: 'Bihar',           lat: 25.6093, lng: 85.1376 },
  { name: 'Gaya',            state: 'Bihar',           lat: 24.7914, lng: 85.0002 },
  { name: 'Bhagalpur',       state: 'Bihar',           lat: 25.2425, lng: 86.9842 },
  { name: 'Muzaffarpur',     state: 'Bihar',           lat: 26.1209, lng: 85.3647 },
  { name: 'Darbhanga',       state: 'Bihar',           lat: 26.1542, lng: 85.8918 },
  { name: 'Purnia',          state: 'Bihar',           lat: 25.7771, lng: 87.4753 },

  // Chhattisgarh
  { name: 'Raipur',          state: 'Chhattisgarh',    lat: 21.2514, lng: 81.6296 },
  { name: 'Bhilai',          state: 'Chhattisgarh',    lat: 21.1938, lng: 81.3509 },
  { name: 'Bilaspur',        state: 'Chhattisgarh',    lat: 22.0797, lng: 82.1409 },
  { name: 'Korba',           state: 'Chhattisgarh',    lat: 22.3595, lng: 82.7501 },
  { name: 'Durg',            state: 'Chhattisgarh',    lat: 21.1904, lng: 81.2849 },

  // Goa
  { name: 'Panaji',          state: 'Goa',             lat: 15.4909, lng: 73.8278 },
  { name: 'Margao',          state: 'Goa',             lat: 15.2832, lng: 73.9862 },
  { name: 'Vasco da Gama',   state: 'Goa',             lat: 15.3961, lng: 73.8157 },

  // Gujarat
  { name: 'Ahmedabad',       state: 'Gujarat',         lat: 23.0225, lng: 72.5714 },
  { name: 'Surat',           state: 'Gujarat',         lat: 21.1702, lng: 72.8311 },
  { name: 'Vadodara',        state: 'Gujarat',         lat: 22.3072, lng: 73.1812 },
  { name: 'Rajkot',          state: 'Gujarat',         lat: 22.3039, lng: 70.8022 },
  { name: 'Bhavnagar',       state: 'Gujarat',         lat: 21.7645, lng: 72.1519 },
  { name: 'Jamnagar',        state: 'Gujarat',         lat: 22.4707, lng: 70.0577 },
  { name: 'Gandhinagar',     state: 'Gujarat',         lat: 23.2156, lng: 72.6369 },
  { name: 'Anand',           state: 'Gujarat',         lat: 22.5645, lng: 72.9289 },
  { name: 'Mundra',          state: 'Gujarat',         lat: 22.8394, lng: 69.7219 },
  { name: 'Kandla',          state: 'Gujarat',         lat: 23.0333, lng: 70.2167 },
  { name: 'Bharuch',         state: 'Gujarat',         lat: 21.7051, lng: 72.9959 },
  { name: 'Junagadh',        state: 'Gujarat',         lat: 21.5222, lng: 70.4579 },

  // Haryana
  { name: 'Gurugram',        state: 'Haryana',         lat: 28.4595, lng: 77.0266 },
  { name: 'Faridabad',       state: 'Haryana',         lat: 28.4089, lng: 77.3178 },
  { name: 'Panipat',         state: 'Haryana',         lat: 29.3909, lng: 76.9635 },
  { name: 'Hisar',           state: 'Haryana',         lat: 29.1492, lng: 75.7217 },
  { name: 'Karnal',          state: 'Haryana',         lat: 29.6857, lng: 76.9905 },
  { name: 'Rohtak',          state: 'Haryana',         lat: 28.8955, lng: 76.6066 },
  { name: 'Ambala',          state: 'Haryana',         lat: 30.3782, lng: 76.7767 },
  { name: 'Sonipat',         state: 'Haryana',         lat: 28.9931, lng: 77.0151 },
  { name: 'Yamunanagar',     state: 'Haryana',         lat: 30.1290, lng: 77.2674 },

  // Himachal Pradesh
  { name: 'Shimla',          state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { name: 'Manali',          state: 'Himachal Pradesh', lat: 32.2432, lng: 77.1892 },
  { name: 'Dharamshala',     state: 'Himachal Pradesh', lat: 32.2190, lng: 76.3234 },
  { name: 'Solan',           state: 'Himachal Pradesh', lat: 30.9045, lng: 77.0967 },
  { name: 'Kullu',           state: 'Himachal Pradesh', lat: 31.9578, lng: 77.1095 },

  // Jharkhand
  { name: 'Ranchi',          state: 'Jharkhand',       lat: 23.3441, lng: 85.3096 },
  { name: 'Jamshedpur',      state: 'Jharkhand',       lat: 22.8046, lng: 86.2029 },
  { name: 'Dhanbad',         state: 'Jharkhand',       lat: 23.7957, lng: 86.4304 },
  { name: 'Bokaro',          state: 'Jharkhand',       lat: 23.6693, lng: 86.1511 },
  { name: 'Hazaribagh',      state: 'Jharkhand',       lat: 23.9983, lng: 85.3617 },

  // Karnataka
  { name: 'Bangalore',       state: 'Karnataka',       lat: 12.9716, lng: 77.5946 },
  { name: 'Mysore',          state: 'Karnataka',       lat: 12.2958, lng: 76.6394 },
  { name: 'Mangalore',       state: 'Karnataka',       lat: 12.9141, lng: 74.8560 },
  { name: 'Hubli',           state: 'Karnataka',       lat: 15.3647, lng: 75.1240 },
  { name: 'Belgaum',         state: 'Karnataka',       lat: 15.8497, lng: 74.4977 },
  { name: 'Gulbarga',        state: 'Karnataka',       lat: 17.3297, lng: 76.8343 },
  { name: 'Davangere',       state: 'Karnataka',       lat: 14.4644, lng: 75.9218 },
  { name: 'Bellary',         state: 'Karnataka',       lat: 15.1394, lng: 76.9214 },
  { name: 'Tumkur',          state: 'Karnataka',       lat: 13.3409, lng: 77.1010 },
  { name: 'Shimoga',         state: 'Karnataka',       lat: 13.9299, lng: 75.5681 },
  { name: 'Bidar',           state: 'Karnataka',       lat: 17.9133, lng: 77.5301 },
  { name: 'Hassan',          state: 'Karnataka',       lat: 13.0072, lng: 76.0962 },

  // Kerala
  { name: 'Trivandrum',      state: 'Kerala',          lat: 8.5241,  lng: 76.9366 },
  { name: 'Kochi',           state: 'Kerala',          lat: 9.9312,  lng: 76.2673 },
  { name: 'Kozhikode',       state: 'Kerala',          lat: 11.2588, lng: 75.7804 },
  { name: 'Thrissur',        state: 'Kerala',          lat: 10.5276, lng: 76.2144 },
  { name: 'Kollam',          state: 'Kerala',          lat: 8.8932,  lng: 76.6141 },
  { name: 'Kannur',          state: 'Kerala',          lat: 11.8745, lng: 75.3704 },
  { name: 'Palakkad',        state: 'Kerala',          lat: 10.7867, lng: 76.6548 },
  { name: 'Alappuzha',       state: 'Kerala',          lat: 9.4981,  lng: 76.3388 },
  { name: 'Malappuram',      state: 'Kerala',          lat: 11.0510, lng: 76.0711 },
  { name: 'Kottayam',        state: 'Kerala',          lat: 9.5916,  lng: 76.5222 },

  // Madhya Pradesh
  { name: 'Bhopal',          state: 'Madhya Pradesh',  lat: 23.2599, lng: 77.4126 },
  { name: 'Indore',          state: 'Madhya Pradesh',  lat: 22.7196, lng: 75.8577 },
  { name: 'Gwalior',         state: 'Madhya Pradesh',  lat: 26.2183, lng: 78.1828 },
  { name: 'Jabalpur',        state: 'Madhya Pradesh',  lat: 23.1815, lng: 79.9864 },
  { name: 'Ujjain',          state: 'Madhya Pradesh',  lat: 23.1765, lng: 75.7885 },
  { name: 'Sagar',           state: 'Madhya Pradesh',  lat: 23.8388, lng: 78.7378 },
  { name: 'Dewas',           state: 'Madhya Pradesh',  lat: 22.9676, lng: 76.0534 },
  { name: 'Satna',           state: 'Madhya Pradesh',  lat: 24.5854, lng: 80.8322 },
  { name: 'Ratlam',          state: 'Madhya Pradesh',  lat: 23.3315, lng: 75.0367 },
  { name: 'Rewa',            state: 'Madhya Pradesh',  lat: 24.5362, lng: 81.3037 },

  // Maharashtra
  { name: 'Mumbai',          state: 'Maharashtra',     lat: 19.0760, lng: 72.8777 },
  { name: 'Pune',            state: 'Maharashtra',     lat: 18.5204, lng: 73.8567 },
  { name: 'Nagpur',          state: 'Maharashtra',     lat: 21.1458, lng: 79.0882 },
  { name: 'Nashik',          state: 'Maharashtra',     lat: 19.9975, lng: 73.7898 },
  { name: 'Aurangabad',      state: 'Maharashtra',     lat: 19.8762, lng: 75.3433 },
  { name: 'Solapur',         state: 'Maharashtra',     lat: 17.6599, lng: 75.9064 },
  { name: 'Kolhapur',        state: 'Maharashtra',     lat: 16.7050, lng: 74.2433 },
  { name: 'Thane',           state: 'Maharashtra',     lat: 19.2183, lng: 72.9781 },
  { name: 'Navi Mumbai',     state: 'Maharashtra',     lat: 19.0330, lng: 73.0297 },
  { name: 'Amravati',        state: 'Maharashtra',     lat: 20.9374, lng: 77.7796 },
  { name: 'Akola',           state: 'Maharashtra',     lat: 20.7002, lng: 77.0082 },
  { name: 'Nanded',          state: 'Maharashtra',     lat: 19.1383, lng: 77.3210 },
  { name: 'Sangli',          state: 'Maharashtra',     lat: 16.8524, lng: 74.5815 },
  { name: 'Latur',           state: 'Maharashtra',     lat: 18.4088, lng: 76.5604 },
  { name: 'Jalgaon',         state: 'Maharashtra',     lat: 21.0077, lng: 75.5626 },
  { name: 'Chandrapur',      state: 'Maharashtra',     lat: 19.9615, lng: 79.2961 },

  // Manipur
  { name: 'Imphal',          state: 'Manipur',         lat: 24.8170, lng: 93.9368 },
  { name: 'Thoubal',         state: 'Manipur',         lat: 24.6333, lng: 94.0167 },
  { name: 'Bishnupur',       state: 'Manipur',         lat: 24.6300, lng: 93.7700 },
  { name: 'Churachandpur',   state: 'Manipur',         lat: 24.3367, lng: 93.6849 },

  // Meghalaya
  { name: 'Shillong',        state: 'Meghalaya',       lat: 25.5788, lng: 91.8933 },
  { name: 'Tura',            state: 'Meghalaya',       lat: 25.5138, lng: 90.2026 },
  { name: 'Jowai',           state: 'Meghalaya',       lat: 25.4500, lng: 92.2167 },
  { name: 'Nongstoin',       state: 'Meghalaya',       lat: 25.5167, lng: 91.2667 },

  // Mizoram
  { name: 'Aizawl',          state: 'Mizoram',         lat: 23.7271, lng: 92.7176 },
  { name: 'Lunglei',         state: 'Mizoram',         lat: 22.8910, lng: 92.7340 },
  { name: 'Champhai',        state: 'Mizoram',         lat: 23.4561, lng: 93.3293 },
  { name: 'Serchhip',        state: 'Mizoram',         lat: 23.3038, lng: 92.8493 },

  // Nagaland
  { name: 'Kohima',          state: 'Nagaland',        lat: 25.6751, lng: 94.1086 },
  { name: 'Dimapur',         state: 'Nagaland',        lat: 25.9091, lng: 93.7266 },
  { name: 'Mokokchung',      state: 'Nagaland',        lat: 26.3220, lng: 94.5158 },
  { name: 'Tuensang',        state: 'Nagaland',        lat: 26.2746, lng: 94.8295 },

  // Odisha
  { name: 'Bhubaneswar',     state: 'Odisha',          lat: 20.2961, lng: 85.8245 },
  { name: 'Cuttack',         state: 'Odisha',          lat: 20.4625, lng: 85.8830 },
  { name: 'Rourkela',        state: 'Odisha',          lat: 22.2604, lng: 84.8536 },
  { name: 'Puri',            state: 'Odisha',          lat: 19.8135, lng: 85.8312 },
  { name: 'Sambalpur',       state: 'Odisha',          lat: 21.4669, lng: 83.9756 },
  { name: 'Berhampur',       state: 'Odisha',          lat: 19.3149, lng: 84.7941 },
  { name: 'Paradip',         state: 'Odisha',          lat: 20.3162, lng: 86.6112 },

  // Punjab
  { name: 'Ludhiana',        state: 'Punjab',          lat: 30.9010, lng: 75.8573 },
  { name: 'Amritsar',        state: 'Punjab',          lat: 31.6340, lng: 74.8723 },
  { name: 'Jalandhar',       state: 'Punjab',          lat: 31.3260, lng: 75.5762 },
  { name: 'Patiala',         state: 'Punjab',          lat: 30.3398, lng: 76.3869 },
  { name: 'Bathinda',        state: 'Punjab',          lat: 30.2110, lng: 74.9455 },
  { name: 'Mohali',          state: 'Punjab',          lat: 30.7046, lng: 76.7179 },
  { name: 'Pathankot',       state: 'Punjab',          lat: 32.2746, lng: 75.6522 },

  // Rajasthan
  { name: 'Jaipur',          state: 'Rajasthan',       lat: 26.9124, lng: 75.7873 },
  { name: 'Jodhpur',         state: 'Rajasthan',       lat: 26.2389, lng: 73.0243 },
  { name: 'Udaipur',         state: 'Rajasthan',       lat: 24.5854, lng: 73.7125 },
  { name: 'Kota',            state: 'Rajasthan',       lat: 25.2138, lng: 75.8648 },
  { name: 'Bikaner',         state: 'Rajasthan',       lat: 28.0229, lng: 73.3119 },
  { name: 'Ajmer',           state: 'Rajasthan',       lat: 26.4499, lng: 74.6399 },
  { name: 'Alwar',           state: 'Rajasthan',       lat: 27.5530, lng: 76.6346 },
  { name: 'Bharatpur',       state: 'Rajasthan',       lat: 27.2152, lng: 77.4977 },
  { name: 'Sikar',           state: 'Rajasthan',       lat: 27.6094, lng: 75.1399 },

  // Sikkim
  { name: 'Gangtok',         state: 'Sikkim',          lat: 27.3389, lng: 88.6065 },
  { name: 'Namchi',          state: 'Sikkim',          lat: 27.1660, lng: 88.3639 },
  { name: 'Geyzing',         state: 'Sikkim',          lat: 27.2833, lng: 88.2667 },
  { name: 'Mangan',          state: 'Sikkim',          lat: 27.5050, lng: 88.5290 },

  // Tamil Nadu
  { name: 'Chennai',         state: 'Tamil Nadu',      lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore',      state: 'Tamil Nadu',      lat: 11.0168, lng: 76.9558 },
  { name: 'Madurai',         state: 'Tamil Nadu',      lat: 9.9252,  lng: 78.1198 },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu',      lat: 10.7905, lng: 78.7047 },
  { name: 'Salem',           state: 'Tamil Nadu',      lat: 11.6643, lng: 78.1460 },
  { name: 'Tirunelveli',     state: 'Tamil Nadu',      lat: 8.7139,  lng: 77.7567 },
  { name: 'Erode',           state: 'Tamil Nadu',      lat: 11.3410, lng: 77.7172 },
  { name: 'Vellore',         state: 'Tamil Nadu',      lat: 12.9165, lng: 79.1325 },
  { name: 'Tirupur',         state: 'Tamil Nadu',      lat: 11.1085, lng: 77.3411 },
  { name: 'Thoothukudi',     state: 'Tamil Nadu',      lat: 8.7642,  lng: 78.1348 },
  { name: 'Thanjavur',       state: 'Tamil Nadu',      lat: 10.7870, lng: 79.1378 },
  { name: 'Karur',           state: 'Tamil Nadu',      lat: 10.9601, lng: 78.0766 },
  { name: 'Cuddalore',       state: 'Tamil Nadu',      lat: 11.7480, lng: 79.7714 },
  { name: 'Kanchipuram',     state: 'Tamil Nadu',      lat: 12.8342, lng: 79.7036 },
  { name: 'Dindigul',        state: 'Tamil Nadu',      lat: 10.3673, lng: 77.9803 },
  { name: 'Nagercoil',       state: 'Tamil Nadu',      lat: 8.1833,  lng: 77.4119 },
  { name: 'Hosur',           state: 'Tamil Nadu',      lat: 12.7409, lng: 77.8253 },

  // Telangana
  { name: 'Hyderabad',       state: 'Telangana',       lat: 17.3850, lng: 78.4867 },
  { name: 'Warangal',        state: 'Telangana',       lat: 17.9689, lng: 79.5941 },
  { name: 'Nizamabad',       state: 'Telangana',       lat: 18.6725, lng: 78.0941 },
  { name: 'Karimnagar',      state: 'Telangana',       lat: 18.4386, lng: 79.1288 },
  { name: 'Khammam',         state: 'Telangana',       lat: 17.2473, lng: 80.1514 },

  // Tripura
  { name: 'Agartala',        state: 'Tripura',         lat: 23.8315, lng: 91.2868 },
  { name: 'Udaipur (Tripura)', state: 'Tripura',       lat: 23.5333, lng: 91.4833 },
  { name: 'Dharmanagar',     state: 'Tripura',         lat: 24.3700, lng: 92.1700 },
  { name: 'Kailasahar',      state: 'Tripura',         lat: 24.3300, lng: 92.0000 },
  { name: 'Belonia',         state: 'Tripura',         lat: 23.2533, lng: 91.4537 },

  // Uttar Pradesh
  { name: 'Lucknow',         state: 'Uttar Pradesh',   lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur',          state: 'Uttar Pradesh',   lat: 26.4499, lng: 80.3319 },
  { name: 'Agra',            state: 'Uttar Pradesh',   lat: 27.1767, lng: 78.0081 },
  { name: 'Varanasi',        state: 'Uttar Pradesh',   lat: 25.3176, lng: 82.9739 },
  { name: 'Meerut',          state: 'Uttar Pradesh',   lat: 28.9845, lng: 77.7064 },
  { name: 'Prayagraj',       state: 'Uttar Pradesh',   lat: 25.4358, lng: 81.8463 },
  { name: 'Ghaziabad',       state: 'Uttar Pradesh',   lat: 28.6692, lng: 77.4538 },
  { name: 'Noida',           state: 'Uttar Pradesh',   lat: 28.5355, lng: 77.3910 },
  { name: 'Aligarh',         state: 'Uttar Pradesh',   lat: 27.8974, lng: 78.0880 },
  { name: 'Bareilly',        state: 'Uttar Pradesh',   lat: 28.3670, lng: 79.4304 },
  { name: 'Moradabad',       state: 'Uttar Pradesh',   lat: 28.8386, lng: 78.7733 },
  { name: 'Saharanpur',      state: 'Uttar Pradesh',   lat: 29.9680, lng: 77.5552 },
  { name: 'Gorakhpur',       state: 'Uttar Pradesh',   lat: 26.7606, lng: 83.3732 },
  { name: 'Mathura',         state: 'Uttar Pradesh',   lat: 27.4924, lng: 77.6737 },
  { name: 'Jhansi',          state: 'Uttar Pradesh',   lat: 25.4484, lng: 78.5685 },
  { name: 'Firozabad',       state: 'Uttar Pradesh',   lat: 27.1591, lng: 78.3957 },

  // Uttarakhand
  { name: 'Dehradun',        state: 'Uttarakhand',     lat: 30.3165, lng: 78.0322 },
  { name: 'Haridwar',        state: 'Uttarakhand',     lat: 29.9457, lng: 78.1642 },
  { name: 'Roorkee',         state: 'Uttarakhand',     lat: 29.8543, lng: 77.8880 },
  { name: 'Haldwani',        state: 'Uttarakhand',     lat: 29.2183, lng: 79.5130 },
  { name: 'Rishikesh',       state: 'Uttarakhand',     lat: 30.0869, lng: 78.2676 },
  { name: 'Kashipur',        state: 'Uttarakhand',     lat: 29.2106, lng: 78.9618 },

  // West Bengal
  { name: 'Kolkata',         state: 'West Bengal',     lat: 22.5726, lng: 88.3639 },
  { name: 'Howrah',          state: 'West Bengal',     lat: 22.5958, lng: 88.2636 },
  { name: 'Durgapur',        state: 'West Bengal',     lat: 23.5204, lng: 87.3119 },
  { name: 'Asansol',         state: 'West Bengal',     lat: 23.6889, lng: 86.9661 },
  { name: 'Siliguri',        state: 'West Bengal',     lat: 26.7271, lng: 88.3953 },
  { name: 'Kharagpur',       state: 'West Bengal',     lat: 22.3460, lng: 87.2320 },
  { name: 'Haldia',          state: 'West Bengal',     lat: 22.0667, lng: 88.0698 },
  { name: 'Bardhaman',       state: 'West Bengal',     lat: 23.2324, lng: 87.8615 },

  // Union Territories
  { name: 'Delhi',           state: 'Delhi',           lat: 28.6139, lng: 77.2090 },
  { name: 'New Delhi',       state: 'Delhi',           lat: 28.6139, lng: 77.2295 },
  { name: 'Chandigarh',      state: 'Chandigarh',      lat: 30.7333, lng: 76.7794 },
  { name: 'Srinagar',        state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { name: 'Jammu',           state: 'Jammu & Kashmir', lat: 32.7266, lng: 74.8570 },
  { name: 'Anantnag',        state: 'Jammu & Kashmir', lat: 33.7311, lng: 75.1487 },
  { name: 'Baramulla',       state: 'Jammu & Kashmir', lat: 34.2090, lng: 74.3436 },
  { name: 'Udhampur',        state: 'Jammu & Kashmir', lat: 32.9159, lng: 75.1416 },
  { name: 'Leh',             state: 'Ladakh',          lat: 34.1526, lng: 77.5771 },
  { name: 'Kargil',          state: 'Ladakh',          lat: 34.5539, lng: 76.1349 },
  { name: 'Puducherry',      state: 'Puducherry',      lat: 11.9416, lng: 79.8083 },
  { name: 'Karaikal',        state: 'Puducherry',      lat: 10.9254, lng: 79.8380 },
  { name: 'Mahe',            state: 'Puducherry',      lat: 11.7022, lng: 75.5365 },
  { name: 'Yanam',           state: 'Puducherry',      lat: 16.7333, lng: 82.2167 },
  { name: 'Port Blair',      state: 'Andaman & Nicobar', lat: 11.6234, lng: 92.7265 },
  { name: 'Daman',           state: 'Daman & Diu',     lat: 20.4283, lng: 72.8397 },
  { name: 'Diu',             state: 'Daman & Diu',     lat: 20.7144, lng: 70.9874 },
  { name: 'Silvassa',        state: 'Dadra & Nagar Haveli', lat: 20.2738, lng: 73.0085 },
  { name: 'Kavaratti',       state: 'Lakshadweep',     lat: 10.5667, lng: 72.6417 },
  { name: 'Agatti',          state: 'Lakshadweep',     lat: 10.8500, lng: 72.2000 },
];
