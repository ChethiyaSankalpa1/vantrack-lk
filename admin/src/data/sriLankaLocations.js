/**
 * Sri Lanka Complete Geographic Hierarchy
 * 9 Provinces, 25 Districts, Major Hubs, and Key Schools
 */

export const SRI_LANKA_PROVINCES = [
  {
    name: 'Western',
    center: [6.9271, 79.8612],
    districts: [
      {
        name: 'Colombo',
        center: [6.9271, 79.8612],
        towns: ['Colombo 01-15', 'Maharagama', 'Nugegoda', 'Kottawa', 'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Homagama', 'Battaramulla', 'Kaduwela', 'Piliyandala'],
        schools: ['Royal College', 'Ananda College', 'Nalanda College', 'Visakha Vidyalaya', 'Devi Balika Vidyalaya', 'Musaeus College', 'D. S. Senanayake College', 'St. Joseph\'s College', 'St. Peter\'s College', 'Sirimavo Bandaranaike Vidyalaya', 'Ladies\' College', 'Bishop\'s College'],
      },
      {
        name: 'Gampaha',
        center: [7.0917, 79.9999],
        towns: ['Gampaha', 'Negombo', 'Kelaniya', 'Kadawatha', 'Kiribathgoda', 'Ja-Ela', 'Wattala', 'Minuwangoda', 'Mirigama', 'Veyangoda'],
        schools: ['Bandaranaike College', 'Holy Cross College Negombo', 'Maris Stella College', 'Rathnavali Balika Vidyalaya', 'Sri Dharmaloka College Kelaniya'],
      },
      {
        name: 'Kalutara',
        center: [6.5854, 79.9607],
        towns: ['Kalutara', 'Panadura', 'Horana', 'Beruwala', 'Matugama', 'Aluthgama', 'Wadduwa', 'Bandaragama'],
        schools: ['Kalutara Vidyalaya', 'Sri Sumangala College Panadura', 'Taxila Central College Horana', 'Balika Vidyalaya Kalutara'],
      },
    ],
  },
  {
    name: 'Central',
    center: [7.2906, 80.6337],
    districts: [
      {
        name: 'Kandy',
        center: [7.2906, 80.6337],
        towns: ['Kandy City', 'Peradeniya', 'Katugastota', 'Gampola', 'Akurana', 'Digana', 'Kundasale', 'Pilimathalawa'],
        schools: ['Trinity College', 'Kingswood College', 'Dharmaraja College', 'Kandy High School', 'Mahamaya Girls\' College', 'St. Anthony\'s College', 'Girls\' High School Kandy'],
      },
      {
        name: 'Matale',
        center: [7.4675, 80.6234],
        towns: ['Matale', 'Dambulla', 'Galewela', 'Ukuwela', 'Rattota'],
        schools: ['St. Thomas\' College Matale', 'Vijaya College', 'Government Science College Matale'],
      },
      {
        name: 'Nuwara Eliya',
        center: [6.9497, 80.7891],
        towns: ['Nuwara Eliya', 'Hatton', 'Talawakele', 'Ginigathena', 'Ragala'],
        schools: ['Gamini National College', 'St. Patrick\'s College Hatton', 'Highlands College Hatton'],
      },
    ],
  },
  {
    name: 'Southern',
    center: [6.0535, 80.221],
    districts: [
      {
        name: 'Galle',
        center: [6.0535, 80.221],
        towns: ['Galle Fort', 'Karapitiya', 'Hikkaduwa', 'Ambalangoda', 'Elpitiya', 'Baddegama', 'Ahangama'],
        schools: ['Richmond College', 'Mahinda College', 'Southlands College', 'Sanghamitta Balika Vidyalaya', 'St. Aloysius\' College', 'Dharmasoka College Ambalangoda'],
      },
      {
        name: 'Matara',
        center: [5.9549, 80.555],
        towns: ['Matara City', 'Weligama', 'Dickwella', 'Akuressa', 'Hakmana', 'Kamburupitiya'],
        schools: ['Rahula College', 'Sujatha Vidyalaya Matara', 'St. Thomas\' College Matara', 'St. Servatius\' College'],
      },
      {
        name: 'Hambantota',
        center: [6.1248, 81.1185],
        towns: ['Hambantota', 'Tangalle', 'Beliatta', 'Ambalantota', 'Tissamaharama'],
        schools: ['Tangalle Boys\' School', 'Theraputta National School', 'Debarawewa National School'],
      },
    ],
  },
  {
    name: 'Northern',
    center: [9.6615, 80.0255],
    districts: [
      {
        name: 'Jaffna',
        center: [9.6615, 80.0255],
        towns: ['Jaffna City', 'Nallur', 'Chavakachcheri', 'Point Pedro', 'Kankesanthurai', 'Vaddukoddai'],
        schools: ['Jaffna Central College', 'Jaffna Hindu College', 'St. John\'s College Jaffna', 'Vembadi Girls\' High School', 'Chundikuli Girls\' College'],
      },
      {
        name: 'Kilinochchi',
        center: [9.3803, 80.377],
        towns: ['Kilinochchi', 'Paranthan', 'Poonakary'],
        schools: ['Kilinochchi Maha Vidyalayam', 'Kilinochchi Central College'],
      },
      {
        name: 'Mannar',
        center: [8.981, 79.9044],
        towns: ['Mannar Town', 'Talaimannar', 'Murunkan'],
        schools: ['St. Xavier\'s Boys\' College Mannar', 'St. Anne\'s College'],
      },
      {
        name: 'Vavuniya',
        center: [8.7542, 80.4982],
        towns: ['Vavuniya Town', 'Nedurkeni', 'Cheddikulam'],
        schools: ['Vavuniya Tamil Maha Vidyalayam', 'Vavuniya Central College'],
      },
      {
        name: 'Mullaitivu',
        center: [9.2671, 80.8143],
        towns: ['Mullaitivu Town', 'Puthukkudiyiruppu', 'Mankulam'],
        schools: ['Mullaitivu Maha Vidyalayam', 'Mulliyawalai Vidyananda College'],
      },
    ],
  },
  {
    name: 'Eastern',
    center: [7.731, 81.6747],
    districts: [
      {
        name: 'Batticaloa',
        center: [7.731, 81.6747],
        towns: ['Batticaloa City', 'Kattankudy', 'Eravur', 'Valaichchenai', 'Kaluwanchikudy'],
        schools: ['St. Michael\'s College Batticaloa', 'Vincent Girls\' High School', 'Batticaloa Hindu College'],
      },
      {
        name: 'Ampara',
        center: [7.2912, 81.6724],
        towns: ['Ampara Town', 'Kalmunai', 'Sammanthurai', 'Akkaraipattu', 'Pottuvil'],
        schools: ['D. S. Senanayake National College Ampara', 'Kalmunai Zahira College', 'Carmel Fatima College'],
      },
      {
        name: 'Trincomalee',
        center: [8.5874, 81.2152],
        towns: ['Trincomalee Town', 'Kinniya', 'Muttur', 'Kantale'],
        schools: ['St. Joseph\'s College Trincomalee', 'Sri Koneswara Hindu College', 'Orr\'s Hill Vivekananda College'],
      },
    ],
  },
  {
    name: 'North Western',
    center: [7.4863, 80.3623],
    districts: [
      {
        name: 'Kurunegala',
        center: [7.4863, 80.3623],
        towns: ['Kurunegala City', 'Kuliyapitiya', 'Narammala', 'Pannala', 'Mawathagama', 'Wariyapola', 'Polgahawela'],
        schools: ['Maliyadeva College', 'Maliyadeva Balika Vidyalaya', 'St. Anne\'s College Kurunegala', 'Holy Family Convent Kurunegala', 'Central College Kuliyapitiya'],
      },
      {
        name: 'Puttalam',
        center: [8.0362, 79.8283],
        towns: ['Puttalam Town', 'Chilaw', 'Marawila', 'Wennappuwa', 'Anamaduwa', 'Nattandiya'],
        schools: ['St. Mary\'s Boys\' College Chilaw', 'Joseph Vaz College Wennappuwa', 'Zahira College Puttalam'],
      },
    ],
  },
  {
    name: 'North Central',
    center: [8.3114, 80.4037],
    districts: [
      {
        name: 'Anuradhapura',
        center: [8.3114, 80.4037],
        towns: ['Anuradhapura New Town', 'Sacred City', 'Kekirawa', 'Medawachchiya', 'Tambuttegama', 'Eppawala'],
        schools: ['Central College Anuradhapura', 'Swarnapali Balika Maha Vidyalaya', 'St. Joseph\'s College Anuradhapura'],
      },
      {
        name: 'Polonnaruwa',
        center: [7.9403, 81.0188],
        towns: ['Kaduruwela', 'Polonnaruwa New Town', 'Hingurakgoda', 'Medirigiriya'],
        schools: ['Royal Central College Polonnaruwa', 'Medirigiriya National School', 'Topawewa Maha Vidyalaya'],
      },
    ],
  },
  {
    name: 'Uva',
    center: [6.9934, 81.055],
    districts: [
      {
        name: 'Badulla',
        center: [6.9934, 81.055],
        towns: ['Badulla City', 'Bandarawela', 'Haputale', 'Hali-Ela', 'Mahiyanganaya', 'Welimada', 'Ella'],
        schools: ['Uva College Badulla', 'Badulla Central College', 'Dharmadutha College', 'St. Thomas\' Higher Basic School Bandarawela', 'Bandarawela Central College'],
      },
      {
        name: 'Monaragala',
        center: [6.8728, 81.3507],
        towns: ['Monaragala Town', 'Wellawaya', 'Buttala', 'Bibile', 'Kataragama'],
        schools: ['Mahanama National College Monaragala', 'Royal College Monaragala'],
      },
    ],
  },
  {
    name: 'Sabaragamuwa',
    center: [6.6828, 80.3992],
    districts: [
      {
        name: 'Ratnapura',
        center: [6.6828, 80.3992],
        towns: ['Ratnapura City', 'Balangoda', 'Pelmadulla', 'Embilipitiya', 'Kuruwita', 'Eheliyagoda'],
        schools: ['Sivali Central College', 'Ferguson High School', 'St. Aloysius\' College Ratnapura', 'R/Ananda Maithreya National College'],
      },
      {
        name: 'Kegalle',
        center: [7.2513, 80.3464],
        towns: ['Kegalle Town', 'Mawanella', 'Warakapola', 'Rambukkana', 'Ruwanwella', 'Dehiowita'],
        schools: ['St. Mary\'s College Kegalle', 'Kegalu Vidyalaya', 'Kegalu Balika Vidyalaya', 'Zahira College Mawanella'],
      },
    ],
  },
];

export const getAllProvinces = () => SRI_LANKA_PROVINCES.map((p) => p.name);

export const getDistrictsForProvince = (provinceName) => {
  const p = SRI_LANKA_PROVINCES.find((item) => item.name.toLowerCase() === (provinceName || '').toLowerCase());
  return p ? p.districts.map((d) => d.name) : [];
};

export const getDistrictInfo = (provinceName, districtName) => {
  const p = SRI_LANKA_PROVINCES.find((item) => item.name.toLowerCase() === (provinceName || '').toLowerCase());
  if (!p) return null;
  return p.districts.find((d) => d.name.toLowerCase() === (districtName || '').toLowerCase()) || p.districts[0];
};

export const getDistrictCenter = (districtName) => {
  for (const prov of SRI_LANKA_PROVINCES) {
    const d = prov.districts.find((dist) => dist.name.toLowerCase() === (districtName || '').toLowerCase());
    if (d) return d.center;
  }
  return [6.9271, 79.8612]; // Default Colombo
};
