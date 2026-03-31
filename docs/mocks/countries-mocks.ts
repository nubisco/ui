const countries = [
  {
    id: 1,
    code: 'AD',
    name: 'Andorra',
    latitude: 42.546245,
    longitude: 1.601554,
    i18n_key: 'CN_AD',
    country_isd: [
      {
        id: 1,
        phone_isd: '+376',
      },
    ],
  },
  {
    id: 2,
    code: 'AE',
    name: 'United Arab Emirates',
    latitude: 23.424076,
    longitude: 53.847818,
    i18n_key: 'CN_AE',
    country_isd: [
      {
        id: 2,
        phone_isd: '+971',
      },
    ],
  },
  {
    id: 3,
    code: 'AF',
    name: 'Afghanista',
    latitude: 33.93911,
    longitude: 67.709953,
    i18n_key: 'CN_AF',
    country_isd: [
      {
        id: 3,
        phone_isd: '+93',
      },
    ],
  },
  {
    id: 4,
    code: 'AG',
    name: 'Antigua and Barbuda',
    latitude: 17.060816,
    longitude: -61.796428,
    i18n_key: 'CN_AG',
    country_isd: [
      {
        id: 4,
        phone_isd: '+1-268',
      },
    ],
  },
  {
    id: 5,
    code: 'AI',
    name: 'Anguilla',
    latitude: 18.220554,
    longitude: -63.068615,
    i18n_key: 'CN_AI',
    country_isd: [
      {
        id: 5,
        phone_isd: '+1-264',
      },
    ],
  },
  {
    id: 6,
    code: 'AL',
    name: 'Albania',
    latitude: 41.153332,
    longitude: 20.168331,
    i18n_key: 'CN_AL',
    country_isd: [
      {
        id: 6,
        phone_isd: '+355',
      },
    ],
  },
  {
    id: 7,
    code: 'AM',
    name: 'Armenia',
    latitude: 40.069099,
    longitude: 45.038189,
    i18n_key: 'CN_AM',
    country_isd: [
      {
        id: 7,
        phone_isd: '+374',
      },
    ],
  },
  {
    id: 8,
    code: 'AO',
    name: 'Angola',
    latitude: -11.202692,
    longitude: 17.873887,
    i18n_key: 'CN_AO',
    country_isd: [
      {
        id: 8,
        phone_isd: '+244',
      },
    ],
  },
  {
    id: 9,
    code: 'AQ',
    name: 'Antarctica',
    latitude: -75.250973,
    longitude: -0.071389,
    i18n_key: 'CN_AQ',
    country_isd: [],
  },
  {
    id: 10,
    code: 'AR',
    name: 'Argentina',
    latitude: -38.416097,
    longitude: -63.616672,
    i18n_key: 'CN_AR',
    country_isd: [
      {
        id: 9,
        phone_isd: '+54',
      },
    ],
  },
  {
    id: 11,
    code: 'AS',
    name: 'American Samoa',
    latitude: -14.270972,
    longitude: -170.132217,
    i18n_key: 'CN_AS',
    country_isd: [
      {
        id: 10,
        phone_isd: '+1-684',
      },
    ],
  },
  {
    id: 12,
    code: 'AT',
    name: 'Austria',
    latitude: 47.516231,
    longitude: 14.550072,
    i18n_key: 'CN_AT',
    country_isd: [
      {
        id: 11,
        phone_isd: '+43',
      },
    ],
  },
  {
    id: 13,
    code: 'AU',
    name: 'Australia',
    latitude: -25.274398,
    longitude: 133.775136,
    i18n_key: 'CN_AU',
    country_isd: [
      {
        id: 12,
        phone_isd: '+61',
      },
    ],
  },
  {
    id: 14,
    code: 'AW',
    name: 'Aruba',
    latitude: 12.52111,
    longitude: -69.968338,
    i18n_key: 'CN_AW',
    country_isd: [
      {
        id: 13,
        phone_isd: '+297',
      },
    ],
  },
  {
    id: 15,
    code: 'AX',
    name: 'Åland Islands',
    i18n_key: 'CN_AX',
    country_isd: [
      {
        id: 14,
        phone_isd: '+358-18',
      },
    ],
  },
  {
    id: 16,
    code: 'AZ',
    name: 'Azerbaija',
    latitude: 40.143105,
    longitude: 47.576927,
    i18n_key: 'CN_AZ',
    country_isd: [
      {
        id: 15,
        phone_isd: '+994',
      },
    ],
  },
  {
    id: 17,
    code: 'BA',
    name: 'Bosnia and Herzegovina',
    latitude: 43.915886,
    longitude: 17.679076,
    i18n_key: 'CN_BA',
    country_isd: [
      {
        id: 16,
        phone_isd: '+387',
      },
    ],
  },
  {
    id: 18,
    code: 'BB',
    name: 'Barbados',
    latitude: 13.193887,
    longitude: -59.543198,
    i18n_key: 'CN_BB',
    country_isd: [
      {
        id: 17,
        phone_isd: '+1-246',
      },
    ],
  },
  {
    id: 19,
    code: 'BD',
    name: 'Bangladesh',
    latitude: 23.684994,
    longitude: 90.356331,
    i18n_key: 'CN_BD',
    country_isd: [
      {
        id: 18,
        phone_isd: '+880',
      },
    ],
  },
  {
    id: 20,
    code: 'BE',
    name: 'Belgium',
    latitude: 50.503887,
    longitude: 4.469936,
    i18n_key: 'CN_BE',
    country_isd: [
      {
        id: 19,
        phone_isd: '+32',
      },
    ],
  },
  {
    id: 21,
    code: 'BF',
    name: 'Burkina Faso',
    latitude: 12.238333,
    longitude: -1.561593,
    i18n_key: 'CN_BF',
    country_isd: [
      {
        id: 20,
        phone_isd: '+226',
      },
    ],
  },
  {
    id: 22,
    code: 'BG',
    name: 'Bulgaria',
    latitude: 42.733883,
    longitude: 25.48583,
    i18n_key: 'CN_BG',
    country_isd: [
      {
        id: 21,
        phone_isd: '+359',
      },
    ],
  },
  {
    id: 23,
    code: 'BH',
    name: 'Bahrai',
    latitude: 25.930414,
    longitude: 50.637772,
    i18n_key: 'CN_BH',
    country_isd: [
      {
        id: 22,
        phone_isd: '+973',
      },
    ],
  },
  {
    id: 24,
    code: 'BI',
    name: 'Burundi',
    latitude: -3.373056,
    longitude: 29.918886,
    i18n_key: 'CN_BI',
    country_isd: [
      {
        id: 23,
        phone_isd: '+257',
      },
    ],
  },
  {
    id: 25,
    code: 'BJ',
    name: 'Beni',
    latitude: 9.30769,
    longitude: 2.315834,
    i18n_key: 'CN_BJ',
    country_isd: [
      {
        id: 24,
        phone_isd: '+229',
      },
    ],
  },
  {
    id: 26,
    code: 'BL',
    name: 'Saint Barthélemy',
    i18n_key: 'CN_BL',
    country_isd: [
      {
        id: 25,
        phone_isd: '+590',
      },
    ],
  },
  {
    id: 27,
    code: 'BM',
    name: 'Bermuda',
    latitude: 32.321384,
    longitude: -64.75737,
    i18n_key: 'CN_BM',
    country_isd: [
      {
        id: 26,
        phone_isd: '+1-441',
      },
    ],
  },
  {
    id: 28,
    code: 'BN',
    name: 'Brunei Darussalam',
    latitude: 4.535277,
    longitude: 114.727669,
    i18n_key: 'CN_BN',
    country_isd: [
      {
        id: 27,
        phone_isd: '+673',
      },
    ],
  },
  {
    id: 29,
    code: 'BO',
    name: 'Bolivia (Plurinational State of)',
    latitude: -16.290154,
    longitude: -63.588653,
    i18n_key: 'CN_BO',
    country_isd: [
      {
        id: 28,
        phone_isd: '+591',
      },
    ],
  },
  {
    id: 30,
    code: 'BQ',
    name: 'Bonaire, Sint Eustatius and Saba',
    i18n_key: 'CN_BQ',
    country_isd: [
      {
        id: 29,
        phone_isd: '+599',
      },
    ],
  },
  {
    id: 31,
    code: 'BR',
    name: 'Brazil',
    latitude: -14.235004,
    longitude: -51.92528,
    i18n_key: 'CN_BR',
    country_isd: [
      {
        id: 30,
        phone_isd: '+55',
      },
    ],
  },
  {
    id: 32,
    code: 'BS',
    name: 'Bahamas',
    latitude: 25.03428,
    longitude: -77.39628,
    i18n_key: 'CN_BS',
    country_isd: [
      {
        id: 31,
        phone_isd: '+1-242',
      },
    ],
  },
  {
    id: 33,
    code: 'BT',
    name: 'Bhuta',
    latitude: 27.514162,
    longitude: 90.433601,
    i18n_key: 'CN_BT',
    country_isd: [
      {
        id: 32,
        phone_isd: '+975',
      },
    ],
  },
  {
    id: 34,
    code: 'BV',
    name: 'Bouvet Island',
    latitude: -54.423199,
    longitude: 3.413194,
    i18n_key: 'CN_BV',
    country_isd: [
      {
        id: 33,
        phone_isd: 'null },',
      },
    ],
  },
  {
    id: 35,
    code: 'BW',
    name: 'Botswana',
    latitude: -22.328474,
    longitude: 24.684866,
    i18n_key: 'CN_BW',
    country_isd: [
      {
        id: 34,
        phone_isd: '+267',
      },
    ],
  },
  {
    id: 36,
    code: 'BY',
    name: 'Belarus',
    latitude: 53.709807,
    longitude: 27.953389,
    i18n_key: 'CN_BY',
    country_isd: [
      {
        id: 35,
        phone_isd: '+375',
      },
    ],
  },
  {
    id: 37,
    code: 'BZ',
    name: 'Belize',
    latitude: 17.189877,
    longitude: -88.49765,
    i18n_key: 'CN_BZ',
    country_isd: [
      {
        id: 36,
        phone_isd: '+501',
      },
    ],
  },
  {
    id: 38,
    code: 'CA',
    name: 'Canada',
    latitude: 56.130366,
    longitude: -106.346771,
    i18n_key: 'CN_CA',
    country_isd: [
      {
        id: 37,
        phone_isd: '+1',
      },
    ],
  },
  {
    id: 39,
    code: 'CC',
    name: 'Cocos (Keeling) Islands',
    latitude: -12.164165,
    longitude: 96.870956,
    i18n_key: 'CN_CC',
    country_isd: [
      {
        id: 38,
        phone_isd: '+61',
      },
    ],
  },
  {
    id: 40,
    code: 'CD',
    name: 'Congo, Democratic Republic of the',
    latitude: -4.038333,
    longitude: 21.758664,
    i18n_key: 'CN_CD',
    country_isd: [
      {
        id: 39,
        phone_isd: '+243',
      },
    ],
  },
  {
    id: 41,
    code: 'CF',
    name: 'Central African Republic',
    latitude: 6.611111,
    longitude: 20.939444,
    i18n_key: 'CN_CF',
    country_isd: [
      {
        id: 40,
        phone_isd: '+236',
      },
    ],
  },
  {
    id: 42,
    code: 'CG',
    name: 'Congo',
    latitude: -0.228021,
    longitude: 15.827659,
    i18n_key: 'CN_CG',
    country_isd: [
      {
        id: 41,
        phone_isd: '+242',
      },
    ],
  },
  {
    id: 43,
    code: 'CH',
    name: 'Switzerland',
    latitude: 46.818188,
    longitude: 8.227512,
    i18n_key: 'CN_CH',
    country_isd: [
      {
        id: 42,
        phone_isd: '+41',
      },
    ],
  },
  {
    id: 44,
    code: 'CI',
    name: "Côte d'Ivoire",
    latitude: 7.539989,
    longitude: -5.54708,
    i18n_key: 'CN_CI',
    country_isd: [
      {
        id: 43,
        phone_isd: '+225',
      },
    ],
  },
  {
    id: 45,
    code: 'CK',
    name: 'Cook Islands',
    latitude: -21.236736,
    longitude: -159.777671,
    i18n_key: 'CN_CK',
    country_isd: [
      {
        id: 44,
        phone_isd: '+682',
      },
    ],
  },
  {
    id: 46,
    code: 'CL',
    name: 'Chile',
    latitude: -35.675147,
    longitude: -71.542969,
    i18n_key: 'CN_CL',
    country_isd: [
      {
        id: 45,
        phone_isd: '+56',
      },
    ],
  },
  {
    id: 47,
    code: 'CM',
    name: 'Cameroo',
    latitude: 7.369722,
    longitude: 12.354722,
    i18n_key: 'CN_CM',
    country_isd: [
      {
        id: 46,
        phone_isd: '+237',
      },
    ],
  },
  {
    id: 48,
    code: 'CN',
    name: 'China',
    latitude: 35.86166,
    longitude: 104.195397,
    i18n_key: 'CN_CN',
    country_isd: [
      {
        id: 47,
        phone_isd: '+86',
      },
    ],
  },
  {
    id: 49,
    code: 'CO',
    name: 'Colombia',
    latitude: 4.570868,
    longitude: -74.297333,
    i18n_key: 'CN_CO',
    country_isd: [
      {
        id: 48,
        phone_isd: '+57',
      },
    ],
  },
  {
    id: 50,
    code: 'CR',
    name: 'Costa Rica',
    latitude: 9.748917,
    longitude: -83.753428,
    i18n_key: 'CN_CR',
    country_isd: [
      {
        id: 49,
        phone_isd: '+506',
      },
    ],
  },
  {
    id: 51,
    code: 'CU',
    name: 'Cuba',
    latitude: 21.521757,
    longitude: -77.781167,
    i18n_key: 'CN_CU',
    country_isd: [
      {
        id: 50,
        phone_isd: '+53',
      },
    ],
  },
  {
    id: 52,
    code: 'CV',
    name: 'Cabo Verde',
    latitude: 16.002082,
    longitude: -24.013197,
    i18n_key: 'CN_CV',
    country_isd: [
      {
        id: 51,
        phone_isd: '+238',
      },
    ],
  },
  {
    id: 53,
    code: 'CW',
    name: 'Curaçao',
    i18n_key: 'CN_CW',
    country_isd: [
      {
        id: 52,
        phone_isd: '+599',
      },
    ],
  },
  {
    id: 54,
    code: 'CX',
    name: 'Christmas Island',
    latitude: -10.447525,
    longitude: 105.690449,
    i18n_key: 'CN_CX',
    country_isd: [
      {
        id: 53,
        phone_isd: '+61',
      },
    ],
  },
  {
    id: 55,
    code: 'CY',
    name: 'Cyprus',
    latitude: 35.126413,
    longitude: 33.429859,
    i18n_key: 'CN_CY',
    country_isd: [
      {
        id: 54,
        phone_isd: '+357',
      },
    ],
  },
  {
    id: 56,
    code: 'CZ',
    name: 'Czechia',
    latitude: 49.817492,
    longitude: 15.472962,
    i18n_key: 'CN_CZ',
    country_isd: [
      {
        id: 55,
        phone_isd: '+420',
      },
    ],
  },
  {
    id: 57,
    code: 'DE',
    name: 'Germany',
    latitude: 51.165691,
    longitude: 10.451526,
    i18n_key: 'CN_DE',
    country_isd: [
      {
        id: 56,
        phone_isd: '+49',
      },
    ],
  },
  {
    id: 58,
    code: 'DJ',
    name: 'Djibouti',
    latitude: 11.825138,
    longitude: 42.590275,
    i18n_key: 'CN_DJ',
    country_isd: [
      {
        id: 57,
        phone_isd: '+253',
      },
    ],
  },
  {
    id: 59,
    code: 'DK',
    name: 'Denmark',
    latitude: 56.26392,
    longitude: 9.501785,
    i18n_key: 'CN_DK',
    country_isd: [
      {
        id: 58,
        phone_isd: '+45',
      },
    ],
  },
  {
    id: 60,
    code: 'DM',
    name: 'Dominica',
    latitude: 15.414999,
    longitude: -61.370976,
    i18n_key: 'CN_DM',
    country_isd: [
      {
        id: 59,
        phone_isd: '+1-767',
      },
    ],
  },
  {
    id: 61,
    code: 'DO',
    name: 'Dominican Republic',
    latitude: 18.735693,
    longitude: -70.162651,
    i18n_key: 'CN_DO',
    country_isd: [
      {
        id: 60,
        phone_isd: '+1-809',
      },
      {
        id: 61,
        phone_isd: '+1-82',
      },
    ],
  },
  {
    id: 62,
    code: 'DZ',
    name: 'Algeria',
    latitude: 28.033886,
    longitude: 1.659626,
    i18n_key: 'CN_DZ',
    country_isd: [
      {
        id: 62,
        phone_isd: '+213',
      },
    ],
  },
  {
    id: 63,
    code: 'EC',
    name: 'Ecuador',
    latitude: -1.831239,
    longitude: -78.183406,
    i18n_key: 'CN_EC',
    country_isd: [
      {
        id: 63,
        phone_isd: '+593',
      },
    ],
  },
  {
    id: 64,
    code: 'EE',
    name: 'Estonia',
    latitude: 58.595272,
    longitude: 25.013607,
    i18n_key: 'CN_EE',
    country_isd: [
      {
        id: 64,
        phone_isd: '+372',
      },
    ],
  },
  {
    id: 65,
    code: 'EG',
    name: 'Egypt',
    latitude: 26.820553,
    longitude: 30.802498,
    i18n_key: 'CN_EG',
    country_isd: [
      {
        id: 65,
        phone_isd: '+20',
      },
    ],
  },
  {
    id: 66,
    code: 'EH',
    name: 'Western Sahara',
    latitude: 24.215527,
    longitude: -12.885834,
    i18n_key: 'CN_EH',
    country_isd: [],
  },
  {
    id: 67,
    code: 'ER',
    name: 'Eritrea',
    latitude: 15.179384,
    longitude: 39.782334,
    i18n_key: 'CN_ER',
    country_isd: [
      {
        id: 66,
        phone_isd: '+291',
      },
    ],
  },
  {
    id: 68,
    code: 'ES',
    name: 'Spai',
    latitude: 40.463667,
    longitude: -3.74922,
    i18n_key: 'CN_ES',
    country_isd: [
      {
        id: 67,
        phone_isd: '+34',
      },
    ],
  },
  {
    id: 69,
    code: 'ET',
    name: 'Ethiopia',
    latitude: 9.145,
    longitude: 40.489673,
    i18n_key: 'CN_ET',
    country_isd: [
      {
        id: 68,
        phone_isd: '+251',
      },
    ],
  },
  {
    id: 70,
    code: 'FI',
    name: 'Finland',
    latitude: 61.92411,
    longitude: 25.748151,
    i18n_key: 'CN_FI',
    country_isd: [
      {
        id: 69,
        phone_isd: '358',
      },
    ],
  },
  {
    id: 71,
    code: 'FJ',
    name: 'Fiji',
    latitude: -16.578193,
    longitude: 179.414413,
    i18n_key: 'CN_FJ',
    country_isd: [
      {
        id: 70,
        phone_isd: '+679',
      },
    ],
  },
  {
    id: 72,
    code: 'FK',
    name: 'Falkland Islands (Malvinas)',
    latitude: -51.796253,
    longitude: -59.523613,
    i18n_key: 'CN_FK',
    country_isd: [
      {
        id: 71,
        phone_isd: '+500',
      },
    ],
  },
  {
    id: 73,
    code: 'FM',
    name: 'Micronesia (Federated States of)',
    latitude: 7.425554,
    longitude: 150.550812,
    i18n_key: 'CN_FM',
    country_isd: [
      {
        id: 72,
        phone_isd: '+691',
      },
    ],
  },
  {
    id: 74,
    code: 'FO',
    name: 'Faroe Islands',
    latitude: 61.892635,
    longitude: -6.911806,
    i18n_key: 'CN_FO',
    country_isd: [
      {
        id: 73,
        phone_isd: '+298',
      },
    ],
  },
  {
    id: 75,
    code: 'FR',
    name: 'France',
    latitude: 46.227638,
    longitude: 2.213749,
    i18n_key: 'CN_FR',
    country_isd: [
      {
        id: 74,
        phone_isd: '+33',
      },
    ],
  },
  {
    id: 76,
    code: 'GA',
    name: 'Gabo',
    latitude: -0.803689,
    longitude: 11.609444,
    i18n_key: 'CN_GA',
    country_isd: [
      {
        id: 75,
        phone_isd: '+241',
      },
    ],
  },
  {
    id: 77,
    code: 'GB',
    name: 'United Kingdom of Great Britain and Northern Ireland',
    latitude: 55.378051,
    longitude: -3.435973,
    i18n_key: 'CN_GB',
    country_isd: [
      {
        id: 76,
        phone_isd: '+44',
      },
    ],
  },
  {
    id: 78,
    code: 'GD',
    name: 'Grenada',
    latitude: 12.262776,
    longitude: -61.604171,
    i18n_key: 'CN_GD',
    country_isd: [
      {
        id: 77,
        phone_isd: '+1-473',
      },
    ],
  },
  {
    id: 79,
    code: 'GE',
    name: 'Georgia',
    latitude: 42.315407,
    longitude: 43.356892,
    i18n_key: 'CN_GE',
    country_isd: [
      {
        id: 78,
        phone_isd: '+995',
      },
    ],
  },
  {
    id: 80,
    code: 'GF',
    name: 'French Guiana',
    latitude: 3.933889,
    longitude: -53.125782,
    i18n_key: 'CN_GF',
    country_isd: [
      {
        id: 79,
        phone_isd: '+594',
      },
    ],
  },
  {
    id: 81,
    code: 'GG',
    name: 'Guernsey',
    latitude: 49.465691,
    longitude: -2.585278,
    i18n_key: 'CN_GG',
    country_isd: [
      {
        id: 80,
        phone_isd: '+44-1481',
      },
    ],
  },
  {
    id: 82,
    code: 'GH',
    name: 'Ghana',
    latitude: 7.946527,
    longitude: -1.023194,
    i18n_key: 'CN_GH',
    country_isd: [
      {
        id: 81,
        phone_isd: '+233',
      },
    ],
  },
  {
    id: 83,
    code: 'GI',
    name: 'Gibraltar',
    latitude: 36.137741,
    longitude: -5.345374,
    i18n_key: 'CN_GI',
    country_isd: [
      {
        id: 82,
        phone_isd: '+350',
      },
    ],
  },
  {
    id: 84,
    code: 'GL',
    name: 'Greenland',
    latitude: 71.706936,
    longitude: -42.604303,
    i18n_key: 'CN_GL',
    country_isd: [
      {
        id: 83,
        phone_isd: '+299',
      },
    ],
  },
  {
    id: 85,
    code: 'GM',
    name: 'Gambia',
    latitude: 13.443182,
    longitude: -15.310139,
    i18n_key: 'CN_GM',
    country_isd: [
      {
        id: 84,
        phone_isd: '+220',
      },
    ],
  },
  {
    id: 86,
    code: 'GN',
    name: 'Guinea',
    latitude: 9.945587,
    longitude: -9.696645,
    i18n_key: 'CN_GN',
    country_isd: [
      {
        id: 85,
        phone_isd: '+224',
      },
    ],
  },
  {
    id: 87,
    code: 'GP',
    name: 'Guadeloupe',
    latitude: 16.995971,
    longitude: -62.067641,
    i18n_key: 'CN_GP',
    country_isd: [
      {
        id: 86,
        phone_isd: '+590',
      },
    ],
  },
  {
    id: 88,
    code: 'GQ',
    name: 'Equatorial Guinea',
    latitude: 1.650801,
    longitude: 10.267895,
    i18n_key: 'CN_GQ',
    country_isd: [
      {
        id: 87,
        phone_isd: '+240',
      },
    ],
  },
  {
    id: 89,
    code: 'GR',
    name: 'Greece',
    latitude: 39.074208,
    longitude: 21.824312,
    i18n_key: 'CN_GR',
    country_isd: [
      {
        id: 88,
        phone_isd: '+30',
      },
    ],
  },
  {
    id: 90,
    code: 'GS',
    name: 'South Georgia and the South Sandwich Islands',
    latitude: -54.429579,
    longitude: -36.587909,
    i18n_key: 'CN_GS',
    country_isd: [],
  },
  {
    id: 91,
    code: 'GT',
    name: 'Guatemala',
    latitude: 15.783471,
    longitude: -90.230759,
    i18n_key: 'CN_GT',
    country_isd: [
      {
        id: 89,
        phone_isd: '+502',
      },
    ],
  },
  {
    id: 92,
    code: 'GU',
    name: 'Guam',
    latitude: 13.444304,
    longitude: 144.793731,
    i18n_key: 'CN_GU',
    country_isd: [
      {
        id: 90,
        phone_isd: '+1-671',
      },
    ],
  },
  {
    id: 93,
    code: 'GW',
    name: 'Guinea-Bissau',
    latitude: 11.803749,
    longitude: -15.180413,
    i18n_key: 'CN_GW',
    country_isd: [
      {
        id: 91,
        phone_isd: '+245',
      },
    ],
  },
  {
    id: 94,
    code: 'GY',
    name: 'Guyana',
    latitude: 4.860416,
    longitude: -58.93018,
    i18n_key: 'CN_GY',
    country_isd: [
      {
        id: 92,
        phone_isd: '+592',
      },
    ],
  },
  {
    id: 95,
    code: 'HK',
    name: 'Hong Kong',
    latitude: 22.396428,
    longitude: 114.109497,
    i18n_key: 'CN_HK',
    country_isd: [
      {
        id: 93,
        phone_isd: '+852',
      },
    ],
  },
  {
    id: 96,
    code: 'HM',
    name: 'Heard Island and McDonald Islands',
    latitude: -53.08181,
    longitude: 73.504158,
    i18n_key: 'CN_HM',
    country_isd: [
      {
        id: 94,
        phone_isd: '+672',
      },
    ],
  },
  {
    id: 97,
    code: 'HN',
    name: 'Honduras',
    latitude: 15.199999,
    longitude: -86.241905,
    i18n_key: 'CN_HN',
    country_isd: [
      {
        id: 95,
        phone_isd: '+504',
      },
    ],
  },
  {
    id: 98,
    code: 'HR',
    name: 'Croatia',
    latitude: 45.1,
    longitude: 15.2,
    i18n_key: 'CN_HR',
    country_isd: [
      {
        id: 96,
        phone_isd: '+385',
      },
    ],
  },
  {
    id: 99,
    code: 'HT',
    name: 'Haiti',
    latitude: 18.971187,
    longitude: -72.285215,
    i18n_key: 'CN_HT',
    country_isd: [
      {
        id: 97,
        phone_isd: '+509',
      },
    ],
  },
  {
    id: 100,
    code: 'HU',
    name: 'Hungary',
    latitude: 47.162494,
    longitude: 19.503304,
    i18n_key: 'CN_HU',
    country_isd: [
      {
        id: 98,
        phone_isd: '+36',
      },
    ],
  },
  {
    id: 101,
    code: 'ID',
    name: 'Indonesia',
    latitude: -0.789275,
    longitude: 113.921327,
    i18n_key: 'CN_ID',
    country_isd: [
      {
        id: 99,
        phone_isd: '+62',
      },
    ],
  },
  {
    id: 102,
    code: 'IE',
    name: 'Ireland',
    latitude: 53.41291,
    longitude: -8.24389,
    i18n_key: 'CN_IE',
    country_isd: [
      {
        id: 100,
        phone_isd: '+353',
      },
    ],
  },
  {
    id: 103,
    code: 'IL',
    name: 'Israel',
    latitude: 31.046051,
    longitude: 34.851612,
    i18n_key: 'CN_IL',
    country_isd: [
      {
        id: 101,
        phone_isd: '+972',
      },
    ],
  },
  {
    id: 104,
    code: 'IM',
    name: 'Isle of Ma',
    latitude: 54.236107,
    longitude: -4.548056,
    i18n_key: 'CN_IM',
    country_isd: [
      {
        id: 102,
        phone_isd: '+44-1624',
      },
    ],
  },
  {
    id: 105,
    code: 'IN',
    name: 'India',
    latitude: 20.593684,
    longitude: 78.96288,
    i18n_key: 'CN_IN',
    country_isd: [
      {
        id: 103,
        phone_isd: '+91',
      },
    ],
  },
  {
    id: 106,
    code: 'IO',
    name: 'British Indian Ocean Territory',
    latitude: -6.343194,
    longitude: 71.876519,
    i18n_key: 'CN_IO',
    country_isd: [
      {
        id: 104,
        phone_isd: '+246',
      },
    ],
  },
  {
    id: 107,
    code: 'IQ',
    name: 'Iraq',
    latitude: 33.223191,
    longitude: 43.679291,
    i18n_key: 'CN_IQ',
    country_isd: [
      {
        id: 105,
        phone_isd: '+964',
      },
    ],
  },
  {
    id: 108,
    code: 'IR',
    name: 'Iran (Islamic Republic of)',
    latitude: 32.427908,
    longitude: 53.688046,
    i18n_key: 'CN_IR',
    country_isd: [
      {
        id: 106,
        phone_isd: '+98',
      },
    ],
  },
  {
    id: 109,
    code: 'IS',
    name: 'Iceland',
    latitude: 64.963051,
    longitude: -19.020835,
    i18n_key: 'CN_IS',
    country_isd: [
      {
        id: 107,
        phone_isd: '+354',
      },
    ],
  },
  {
    id: 110,
    code: 'IT',
    name: 'Italy',
    latitude: 41.87194,
    longitude: 12.56738,
    i18n_key: 'CN_IT',
    country_isd: [
      {
        id: 108,
        phone_isd: '+39',
      },
    ],
  },
  {
    id: 111,
    code: 'JE',
    name: 'Jersey',
    latitude: 49.214439,
    longitude: -2.13125,
    i18n_key: 'CN_JE',
    country_isd: [
      {
        id: 109,
        phone_isd: '+44-1534',
      },
    ],
  },
  {
    id: 112,
    code: 'JM',
    name: 'Jamaica',
    latitude: 18.109581,
    longitude: -77.297508,
    i18n_key: 'CN_JM',
    country_isd: [
      {
        id: 110,
        phone_isd: '+1-876',
      },
    ],
  },
  {
    id: 113,
    code: 'JO',
    name: 'Jorda',
    latitude: 30.585164,
    longitude: 36.238414,
    i18n_key: 'CN_JO',
    country_isd: [
      {
        id: 111,
        phone_isd: '+962',
      },
    ],
  },
  {
    id: 114,
    code: 'JP',
    name: 'Japa',
    latitude: 36.204824,
    longitude: 138.252924,
    i18n_key: 'CN_JP',
    country_isd: [
      {
        id: 112,
        phone_isd: '+81',
      },
    ],
  },
  {
    id: 115,
    code: 'KE',
    name: 'Kenya',
    latitude: -0.023559,
    longitude: 37.906193,
    i18n_key: 'CN_KE',
    country_isd: [
      {
        id: 113,
        phone_isd: '+254',
      },
    ],
  },
  {
    id: 116,
    code: 'KG',
    name: 'Kyrgyzsta',
    latitude: 41.20438,
    longitude: 74.766098,
    i18n_key: 'CN_KG',
    country_isd: [
      {
        id: 114,
        phone_isd: '+996',
      },
    ],
  },
  {
    id: 117,
    code: 'KH',
    name: 'Cambodia',
    latitude: 12.565679,
    longitude: 104.990963,
    i18n_key: 'CN_KH',
    country_isd: [
      {
        id: 115,
        phone_isd: '+855',
      },
    ],
  },
  {
    id: 118,
    code: 'KI',
    name: 'Kiribati',
    latitude: -3.370417,
    longitude: -168.734039,
    i18n_key: 'CN_KI',
    country_isd: [
      {
        id: 116,
        phone_isd: '+686',
      },
    ],
  },
  {
    id: 119,
    code: 'KM',
    name: 'Comoros',
    latitude: -11.875001,
    longitude: 43.872219,
    i18n_key: 'CN_KM',
    country_isd: [
      {
        id: 117,
        phone_isd: '+269',
      },
    ],
  },
  {
    id: 120,
    code: 'KN',
    name: 'Saint Kitts and Nevis',
    latitude: 17.357822,
    longitude: -62.782998,
    i18n_key: 'CN_KN',
    country_isd: [
      {
        id: 118,
        phone_isd: '+1-869',
      },
    ],
  },
  {
    id: 121,
    code: 'KP',
    name: "Korea (Democratic People's Republic of)",
    latitude: 40.339852,
    longitude: 127.510093,
    i18n_key: 'CN_KP',
    country_isd: [
      {
        id: 119,
        phone_isd: '+850',
      },
    ],
  },
  {
    id: 122,
    code: 'KR',
    name: 'Korea, Republic of',
    latitude: 35.907757,
    longitude: 127.766922,
    i18n_key: 'CN_KR',
    country_isd: [
      {
        id: 120,
        phone_isd: '+82',
      },
    ],
  },
  {
    id: 123,
    code: 'KW',
    name: 'Kuwait',
    latitude: 29.31166,
    longitude: 47.481766,
    i18n_key: 'CN_KW',
    country_isd: [
      {
        id: 121,
        phone_isd: '+965',
      },
    ],
  },
  {
    id: 124,
    code: 'KY',
    name: 'Cayman Islands',
    latitude: 19.513469,
    longitude: -80.566956,
    i18n_key: 'CN_KY',
    country_isd: [
      {
        id: 122,
        phone_isd: '+1-345',
      },
    ],
  },
  {
    id: 125,
    code: 'KZ',
    name: 'Kazakhsta',
    latitude: 48.019573,
    longitude: 66.923684,
    i18n_key: 'CN_KZ',
    country_isd: [
      {
        id: 123,
        phone_isd: '+7',
      },
    ],
  },
  {
    id: 126,
    code: 'LA',
    name: "Lao People's Democratic Republic",
    latitude: 19.85627,
    longitude: 102.495496,
    i18n_key: 'CN_LA',
    country_isd: [
      {
        id: 124,
        phone_isd: '+856',
      },
    ],
  },
  {
    id: 127,
    code: 'LB',
    name: 'Lebano',
    latitude: 33.854721,
    longitude: 35.862285,
    i18n_key: 'CN_LB',
    country_isd: [
      {
        id: 125,
        phone_isd: '+961',
      },
    ],
  },
  {
    id: 128,
    code: 'LC',
    name: 'Saint Lucia',
    latitude: 13.909444,
    longitude: -60.978893,
    i18n_key: 'CN_LC',
    country_isd: [
      {
        id: 126,
        phone_isd: '+1-758',
      },
    ],
  },
  {
    id: 129,
    code: 'LI',
    name: 'Liechtenstei',
    latitude: 47.166,
    longitude: 9.555373,
    i18n_key: 'CN_LI',
    country_isd: [
      {
        id: 127,
        phone_isd: '+423',
      },
    ],
  },
  {
    id: 130,
    code: 'LK',
    name: 'Sri Lanka',
    latitude: 7.873054,
    longitude: 80.771797,
    i18n_key: 'CN_LK',
    country_isd: [
      {
        id: 128,
        phone_isd: '+94',
      },
    ],
  },
  {
    id: 131,
    code: 'LR',
    name: 'Liberia',
    latitude: 6.428055,
    longitude: -9.429499,
    i18n_key: 'CN_LR',
    country_isd: [
      {
        id: 129,
        phone_isd: '+231',
      },
    ],
  },
  {
    id: 132,
    code: 'LS',
    name: 'Lesotho',
    latitude: -29.609988,
    longitude: 28.233608,
    i18n_key: 'CN_LS',
    country_isd: [
      {
        id: 130,
        phone_isd: '+266',
      },
    ],
  },
  {
    id: 133,
    code: 'LT',
    name: 'Lithuania',
    latitude: 55.169438,
    longitude: 23.881275,
    i18n_key: 'CN_LT',
    country_isd: [
      {
        id: 131,
        phone_isd: '+370',
      },
    ],
  },
  {
    id: 134,
    code: 'LU',
    name: 'Luxembourg',
    latitude: 49.815273,
    longitude: 6.129583,
    i18n_key: 'CN_LU',
    country_isd: [
      {
        id: 132,
        phone_isd: '+352',
      },
    ],
  },
  {
    id: 135,
    code: 'LV',
    name: 'Latvia',
    latitude: 56.879635,
    longitude: 24.603189,
    i18n_key: 'CN_LV',
    country_isd: [
      {
        id: 133,
        phone_isd: '+371',
      },
    ],
  },
  {
    id: 136,
    code: 'LY',
    name: 'Libya',
    latitude: 26.3351,
    longitude: 17.228331,
    i18n_key: 'CN_LY',
    country_isd: [
      {
        id: 134,
        phone_isd: '+218',
      },
    ],
  },
  {
    id: 137,
    code: 'MA',
    name: 'Morocco',
    latitude: 31.791702,
    longitude: -7.09262,
    i18n_key: 'CN_MA',
    country_isd: [
      {
        id: 135,
        phone_isd: '+212',
      },
    ],
  },
  {
    id: 138,
    code: 'MC',
    name: 'Monaco',
    latitude: 43.750298,
    longitude: 7.412841,
    i18n_key: 'CN_MC',
    country_isd: [
      {
        id: 136,
        phone_isd: '+377',
      },
    ],
  },
  {
    id: 139,
    code: 'MD',
    name: 'Moldova, Republic of',
    latitude: 47.411631,
    longitude: 28.369885,
    i18n_key: 'CN_MD',
    country_isd: [
      {
        id: 137,
        phone_isd: '+373',
      },
    ],
  },
  {
    id: 140,
    code: 'ME',
    name: 'Montenegro',
    latitude: 42.708678,
    longitude: 19.37439,
    i18n_key: 'CN_ME',
    country_isd: [
      {
        id: 138,
        phone_isd: '+382',
      },
    ],
  },
  {
    id: 141,
    code: 'MF',
    name: 'Saint Martin (French part)',
    i18n_key: 'CN_MF',
    country_isd: [
      {
        id: 139,
        phone_isd: '+590',
      },
    ],
  },
  {
    id: 142,
    code: 'MG',
    name: 'Madagascar',
    latitude: -18.766947,
    longitude: 46.869107,
    i18n_key: 'CN_MG',
    country_isd: [
      {
        id: 140,
        phone_isd: '+261',
      },
    ],
  },
  {
    id: 143,
    code: 'MH',
    name: 'Marshall Islands',
    latitude: 7.131474,
    longitude: 171.184478,
    i18n_key: 'CN_MH',
    country_isd: [
      {
        id: 141,
        phone_isd: '+692',
      },
    ],
  },
  {
    id: 144,
    code: 'MK',
    name: 'North Macedonia',
    latitude: 41.608635,
    longitude: 21.745275,
    i18n_key: 'CN_MK',
    country_isd: [
      {
        id: 142,
        phone_isd: '+389',
      },
    ],
  },
  {
    id: 145,
    code: 'ML',
    name: 'Mali',
    latitude: 17.570692,
    longitude: -3.996166,
    i18n_key: 'CN_ML',
    country_isd: [
      {
        id: 143,
        phone_isd: '+223',
      },
    ],
  },
  {
    id: 146,
    code: 'MM',
    name: 'Myanmar',
    latitude: 21.913965,
    longitude: 95.956223,
    i18n_key: 'CN_MM',
    country_isd: [
      {
        id: 144,
        phone_isd: '+95',
      },
    ],
  },
  {
    id: 147,
    code: 'MN',
    name: 'Mongolia',
    latitude: 46.862496,
    longitude: 103.846656,
    i18n_key: 'CN_MN',
    country_isd: [
      {
        id: 145,
        phone_isd: '+976',
      },
    ],
  },
  {
    id: 148,
    code: 'MO',
    name: 'Macao',
    latitude: 22.198745,
    longitude: 113.543873,
    i18n_key: 'CN_MO',
    country_isd: [
      {
        id: 146,
        phone_isd: '+853',
      },
    ],
  },
  {
    id: 149,
    code: 'MP',
    name: 'Northern Mariana Islands',
    latitude: 17.33083,
    longitude: 145.38469,
    i18n_key: 'CN_MP',
    country_isd: [
      {
        id: 147,
        phone_isd: '+1-670',
      },
    ],
  },
  {
    id: 150,
    code: 'MQ',
    name: 'Martinique',
    latitude: 14.641528,
    longitude: -61.024174,
    i18n_key: 'CN_MQ',
    country_isd: [
      {
        id: 148,
        phone_isd: '+596',
      },
    ],
  },
  {
    id: 151,
    code: 'MR',
    name: 'Mauritania',
    latitude: 21.00789,
    longitude: -10.940835,
    i18n_key: 'CN_MR',
    country_isd: [
      {
        id: 149,
        phone_isd: '+222',
      },
    ],
  },
  {
    id: 152,
    code: 'MS',
    name: 'Montserrat',
    latitude: 16.742498,
    longitude: -62.187366,
    i18n_key: 'CN_MS',
    country_isd: [
      {
        id: 150,
        phone_isd: '+1-664',
      },
    ],
  },
  {
    id: 153,
    code: 'MT',
    name: 'Malta',
    latitude: 35.937496,
    longitude: 14.375416,
    i18n_key: 'CN_MT',
    country_isd: [
      {
        id: 151,
        phone_isd: '+356',
      },
    ],
  },
  {
    id: 154,
    code: 'MU',
    name: 'Mauritius',
    latitude: -20.348404,
    longitude: 57.552152,
    i18n_key: 'CN_MU',
    country_isd: [
      {
        id: 152,
        phone_isd: '+230',
      },
    ],
  },
  {
    id: 155,
    code: 'MV',
    name: 'Maldives',
    latitude: 3.202778,
    longitude: 73.22068,
    i18n_key: 'CN_MV',
    country_isd: [
      {
        id: 153,
        phone_isd: '+960',
      },
    ],
  },
  {
    id: 156,
    code: 'MW',
    name: 'Malawi',
    latitude: -13.254308,
    longitude: 34.301525,
    i18n_key: 'CN_MW',
    country_isd: [
      {
        id: 154,
        phone_isd: '+265',
      },
    ],
  },
  {
    id: 157,
    code: 'MX',
    name: 'Mexico',
    latitude: 23.634501,
    longitude: -102.552784,
    i18n_key: 'CN_MX',
    country_isd: [
      {
        id: 155,
        phone_isd: '+52',
      },
    ],
  },
  {
    id: 158,
    code: 'MY',
    name: 'Malaysia',
    latitude: 4.210484,
    longitude: 101.975766,
    i18n_key: 'CN_MY',
    country_isd: [
      {
        id: 156,
        phone_isd: '+60',
      },
    ],
  },
  {
    id: 159,
    code: 'MZ',
    name: 'Mozambique',
    latitude: -18.665695,
    longitude: 35.529562,
    i18n_key: 'CN_MZ',
    country_isd: [
      {
        id: 157,
        phone_isd: '+258',
      },
    ],
  },
  {
    id: 160,
    code: 'NA',
    name: 'Namibia',
    latitude: -22.95764,
    longitude: 18.49041,
    i18n_key: 'CN_NA',
    country_isd: [
      {
        id: 158,
        phone_isd: '+264',
      },
    ],
  },
  {
    id: 161,
    code: 'NC',
    name: 'New Caledonia',
    latitude: -20.904305,
    longitude: 165.618042,
    i18n_key: 'CN_NC',
    country_isd: [
      {
        id: 159,
        phone_isd: '+687',
      },
    ],
  },
  {
    id: 162,
    code: 'NE',
    name: 'Niger',
    latitude: 17.607789,
    longitude: 8.081666,
    i18n_key: 'CN_NE',
    country_isd: [
      {
        id: 160,
        phone_isd: '+227',
      },
    ],
  },
  {
    id: 163,
    code: 'NF',
    name: 'Norfolk Island',
    latitude: -29.040835,
    longitude: 167.954712,
    i18n_key: 'CN_NF',
    country_isd: [
      {
        id: 161,
        phone_isd: '+672',
      },
    ],
  },
  {
    id: 164,
    code: 'NG',
    name: 'Nigeria',
    latitude: 9.081999,
    longitude: 8.675277,
    i18n_key: 'CN_NG',
    country_isd: [
      {
        id: 162,
        phone_isd: '+234',
      },
    ],
  },
  {
    id: 165,
    code: 'NI',
    name: 'Nicaragua',
    latitude: 12.865416,
    longitude: -85.207229,
    i18n_key: 'CN_NI',
    country_isd: [
      {
        id: 163,
        phone_isd: '+505',
      },
    ],
  },
  {
    id: 166,
    code: 'NL',
    name: 'Netherlands',
    latitude: 52.132633,
    longitude: 5.291266,
    i18n_key: 'CN_NL',
    country_isd: [
      {
        id: 164,
        phone_isd: '+31',
      },
    ],
  },
  {
    id: 167,
    code: 'NO',
    name: 'Norway',
    latitude: 60.472024,
    longitude: 8.468946,
    i18n_key: 'CN_NO',
    country_isd: [
      {
        id: 165,
        phone_isd: '+47',
      },
    ],
  },
  {
    id: 168,
    code: 'NP',
    name: 'Nepal',
    latitude: 28.394857,
    longitude: 84.124008,
    i18n_key: 'CN_NP',
    country_isd: [
      {
        id: 166,
        phone_isd: '+977',
      },
    ],
  },
  {
    id: 169,
    code: 'NR',
    name: 'Nauru',
    latitude: -0.522778,
    longitude: 166.931503,
    i18n_key: 'CN_NR',
    country_isd: [
      {
        id: 167,
        phone_isd: '+674',
      },
    ],
  },
  {
    id: 170,
    code: 'NU',
    name: 'Niue',
    latitude: -19.054445,
    longitude: -169.867233,
    i18n_key: 'CN_NU',
    country_isd: [
      {
        id: 168,
        phone_isd: '+683',
      },
    ],
  },
  {
    id: 171,
    code: 'NZ',
    name: 'New Zealand',
    latitude: -40.900557,
    longitude: 174.885971,
    i18n_key: 'CN_NZ',
    country_isd: [
      {
        id: 169,
        phone_isd: '+64',
      },
    ],
  },
  {
    id: 172,
    code: 'OM',
    name: 'Oma',
    latitude: 21.512583,
    longitude: 55.923255,
    i18n_key: 'CN_OM',
    country_isd: [
      {
        id: 170,
        phone_isd: '+968',
      },
    ],
  },
  {
    id: 173,
    code: 'PA',
    name: 'Panama',
    latitude: 8.537981,
    longitude: -80.782127,
    i18n_key: 'CN_PA',
    country_isd: [
      {
        id: 171,
        phone_isd: '+507',
      },
    ],
  },
  {
    id: 174,
    code: 'PE',
    name: 'Peru',
    latitude: -9.189967,
    longitude: -75.015152,
    i18n_key: 'CN_PE',
    country_isd: [
      {
        id: 172,
        phone_isd: '+51',
      },
    ],
  },
  {
    id: 175,
    code: 'PF',
    name: 'French Polynesia',
    latitude: -17.679742,
    longitude: -149.406843,
    i18n_key: 'CN_PF',
    country_isd: [
      {
        id: 173,
        phone_isd: '+689',
      },
    ],
  },
  {
    id: 176,
    code: 'PG',
    name: 'Papua New Guinea',
    latitude: -6.314993,
    longitude: 143.95555,
    i18n_key: 'CN_PG',
    country_isd: [
      {
        id: 174,
        phone_isd: '+675',
      },
    ],
  },
  {
    id: 177,
    code: 'PH',
    name: 'Philippines',
    latitude: 12.879721,
    longitude: 121.774017,
    i18n_key: 'CN_PH',
    country_isd: [
      {
        id: 175,
        phone_isd: '+63',
      },
    ],
  },
  {
    id: 178,
    code: 'PK',
    name: 'Pakista',
    latitude: 30.375321,
    longitude: 69.345116,
    i18n_key: 'CN_PK',
    country_isd: [
      {
        id: 176,
        phone_isd: '+92',
      },
    ],
  },
  {
    id: 179,
    code: 'PL',
    name: 'Poland',
    latitude: 51.919438,
    longitude: 19.145136,
    i18n_key: 'CN_PL',
    country_isd: [
      {
        id: 177,
        phone_isd: '+48',
      },
    ],
  },
  {
    id: 180,
    code: 'PM',
    name: 'Saint Pierre and Miquelo',
    latitude: 46.941936,
    longitude: -56.27111,
    i18n_key: 'CN_PM',
    country_isd: [
      {
        id: 178,
        phone_isd: '+508',
      },
    ],
  },
  {
    id: 181,
    code: 'PN',
    name: 'Pitcair',
    latitude: -24.703615,
    longitude: -127.439308,
    i18n_key: 'CN_PN',
    country_isd: [
      {
        id: 179,
        phone_isd: '+64',
      },
    ],
  },
  {
    id: 182,
    code: 'PR',
    name: 'Puerto Rico',
    latitude: 18.220833,
    longitude: -66.590149,
    i18n_key: 'CN_PR',
    country_isd: [
      {
        id: 181,
        phone_isd: '+1-93',
      },
      {
        id: 180,
        phone_isd: '+1-787',
      },
    ],
  },
  {
    id: 183,
    code: 'PS',
    name: 'Palestine, State of',
    latitude: 31.952162,
    longitude: 35.233154,
    i18n_key: 'CN_PS',
    country_isd: [
      {
        id: 182,
        phone_isd: '+970',
      },
    ],
  },
  {
    id: 184,
    code: 'PT',
    name: 'Portugal',
    latitude: 39.399872,
    longitude: -8.224454,
    i18n_key: 'CN_PT',
    country_isd: [
      {
        id: 183,
        phone_isd: '+351',
      },
    ],
  },
  {
    id: 185,
    code: 'PW',
    name: 'Palau',
    latitude: 7.51498,
    longitude: 134.58252,
    i18n_key: 'CN_PW',
    country_isd: [
      {
        id: 184,
        phone_isd: '+680',
      },
    ],
  },
  {
    id: 186,
    code: 'PY',
    name: 'Paraguay',
    latitude: -23.442503,
    longitude: -58.443832,
    i18n_key: 'CN_PY',
    country_isd: [
      {
        id: 185,
        phone_isd: '+595',
      },
    ],
  },
  {
    id: 187,
    code: 'QA',
    name: 'Qatar',
    latitude: 25.354826,
    longitude: 51.183884,
    i18n_key: 'CN_QA',
    country_isd: [
      {
        id: 186,
        phone_isd: '+974',
      },
    ],
  },
  {
    id: 188,
    code: 'RE',
    name: 'Réunio',
    latitude: -21.115141,
    longitude: 55.536384,
    i18n_key: 'CN_RE',
    country_isd: [
      {
        id: 187,
        phone_isd: '+262',
      },
    ],
  },
  {
    id: 189,
    code: 'RO',
    name: 'Romania',
    latitude: 45.943161,
    longitude: 24.96676,
    i18n_key: 'CN_RO',
    country_isd: [
      {
        id: 188,
        phone_isd: '+40',
      },
    ],
  },
  {
    id: 190,
    code: 'RS',
    name: 'Serbia',
    latitude: 44.016521,
    longitude: 21.005859,
    i18n_key: 'CN_RS',
    country_isd: [
      {
        id: 189,
        phone_isd: '+381',
      },
    ],
  },
  {
    id: 191,
    code: 'RU',
    name: 'Russian Federatio',
    latitude: 61.52401,
    longitude: 105.318756,
    i18n_key: 'CN_RU',
    country_isd: [
      {
        id: 190,
        phone_isd: '+7',
      },
    ],
  },
  {
    id: 192,
    code: 'RW',
    name: 'Rwanda',
    latitude: -1.940278,
    longitude: 29.873888,
    i18n_key: 'CN_RW',
    country_isd: [
      {
        id: 191,
        phone_isd: '+250',
      },
    ],
  },
  {
    id: 193,
    code: 'SA',
    name: 'Saudi Arabia',
    latitude: 23.885942,
    longitude: 45.079162,
    i18n_key: 'CN_SA',
    country_isd: [
      {
        id: 192,
        phone_isd: '+966',
      },
    ],
  },
  {
    id: 194,
    code: 'SB',
    name: 'Solomon Islands',
    latitude: -9.64571,
    longitude: 160.156194,
    i18n_key: 'CN_SB',
    country_isd: [
      {
        id: 193,
        phone_isd: '+677',
      },
    ],
  },
  {
    id: 195,
    code: 'SC',
    name: 'Seychelles',
    latitude: -4.679574,
    longitude: 55.491977,
    i18n_key: 'CN_SC',
    country_isd: [
      {
        id: 194,
        phone_isd: '+248',
      },
    ],
  },
  {
    id: 196,
    code: 'SD',
    name: 'Suda',
    latitude: 12.862807,
    longitude: 30.217636,
    i18n_key: 'CN_SD',
    country_isd: [
      {
        id: 195,
        phone_isd: '+249',
      },
    ],
  },
  {
    id: 197,
    code: 'SE',
    name: 'Swede',
    latitude: 60.128161,
    longitude: 18.643501,
    i18n_key: 'CN_SE',
    country_isd: [
      {
        id: 196,
        phone_isd: '+46',
      },
    ],
  },
  {
    id: 198,
    code: 'SG',
    name: 'Singapore',
    latitude: 1.352083,
    longitude: 103.819836,
    i18n_key: 'CN_SG',
    country_isd: [
      {
        id: 197,
        phone_isd: '+65',
      },
    ],
  },
  {
    id: 199,
    code: 'SH',
    name: 'Saint Helena, Ascension and Tristan da Cunha',
    latitude: -24.143474,
    longitude: -10.030696,
    i18n_key: 'CN_SH',
    country_isd: [
      {
        id: 198,
        phone_isd: '+290',
      },
    ],
  },
  {
    id: 200,
    code: 'SI',
    name: 'Slovenia',
    latitude: 46.151241,
    longitude: 14.995463,
    i18n_key: 'CN_SI',
    country_isd: [
      {
        id: 199,
        phone_isd: '+386',
      },
    ],
  },
  {
    id: 201,
    code: 'SJ',
    name: 'Svalbard and Jan Maye',
    latitude: 77.553604,
    longitude: 23.670272,
    i18n_key: 'CN_SJ',
    country_isd: [
      {
        id: 200,
        phone_isd: '+47',
      },
    ],
  },
  {
    id: 202,
    code: 'SK',
    name: 'Slovakia',
    latitude: 48.669026,
    longitude: 19.699024,
    i18n_key: 'CN_SK',
    country_isd: [
      {
        id: 201,
        phone_isd: '+421',
      },
    ],
  },
  {
    id: 203,
    code: 'SL',
    name: 'Sierra Leone',
    latitude: 8.460555,
    longitude: -11.779889,
    i18n_key: 'CN_SL',
    country_isd: [
      {
        id: 202,
        phone_isd: '+232',
      },
    ],
  },
  {
    id: 204,
    code: 'SM',
    name: 'San Marino',
    latitude: 43.94236,
    longitude: 12.457777,
    i18n_key: 'CN_SM',
    country_isd: [
      {
        id: 203,
        phone_isd: '+378',
      },
    ],
  },
  {
    id: 205,
    code: 'SN',
    name: 'Senegal',
    latitude: 14.497401,
    longitude: -14.452362,
    i18n_key: 'CN_SN',
    country_isd: [
      {
        id: 204,
        phone_isd: '+221',
      },
    ],
  },
  {
    id: 206,
    code: 'SO',
    name: 'Somalia',
    latitude: 5.152149,
    longitude: 46.199616,
    i18n_key: 'CN_SO',
    country_isd: [
      {
        id: 205,
        phone_isd: '+252',
      },
    ],
  },
  {
    id: 207,
    code: 'SR',
    name: 'Suriname',
    latitude: 3.919305,
    longitude: -56.027783,
    i18n_key: 'CN_SR',
    country_isd: [
      {
        id: 206,
        phone_isd: '+597',
      },
    ],
  },
  {
    id: 208,
    code: 'SS',
    name: 'South Suda',
    i18n_key: 'CN_SS',
    country_isd: [
      {
        id: 207,
        phone_isd: '+211',
      },
    ],
  },
  {
    id: 209,
    code: 'ST',
    name: 'Sao Tome and Principe',
    latitude: 0.18636,
    longitude: 6.613081,
    i18n_key: 'CN_ST',
    country_isd: [
      {
        id: 208,
        phone_isd: '+239',
      },
    ],
  },
  {
    id: 210,
    code: 'SV',
    name: 'El Salvador',
    latitude: 13.794185,
    longitude: -88.89653,
    i18n_key: 'CN_SV',
    country_isd: [
      {
        id: 209,
        phone_isd: '+503',
      },
    ],
  },
  {
    id: 211,
    code: 'SX',
    name: 'Sint Maarten (Dutch part)',
    i18n_key: 'CN_SX',
    country_isd: [
      {
        id: 210,
        phone_isd: '+599',
      },
    ],
  },
  {
    id: 212,
    code: 'SY',
    name: 'Syrian Arab Republic',
    latitude: 34.802075,
    longitude: 38.996815,
    i18n_key: 'CN_SY',
    country_isd: [
      {
        id: 211,
        phone_isd: '+963',
      },
    ],
  },
  {
    id: 213,
    code: 'SZ',
    name: 'Eswatini',
    latitude: -26.522503,
    longitude: 31.465866,
    i18n_key: 'CN_SZ',
    country_isd: [
      {
        id: 212,
        phone_isd: '+268',
      },
    ],
  },
  {
    id: 214,
    code: 'TC',
    name: 'Turks and Caicos Islands',
    latitude: 21.694025,
    longitude: -71.797928,
    i18n_key: 'CN_TC',
    country_isd: [
      {
        id: 213,
        phone_isd: '+1-649',
      },
    ],
  },
  {
    id: 215,
    code: 'TD',
    name: 'Chad',
    latitude: 15.454166,
    longitude: 18.732207,
    i18n_key: 'CN_TD',
    country_isd: [
      {
        id: 214,
        phone_isd: '+235',
      },
    ],
  },
  {
    id: 216,
    code: 'TF',
    name: 'French Southern Territories',
    latitude: -49.280366,
    longitude: 69.348557,
    i18n_key: 'CN_TF',
    country_isd: [
      {
        id: 215,
        phone_isd: '+262',
      },
    ],
  },
  {
    id: 217,
    code: 'TG',
    name: 'Togo',
    latitude: 8.619543,
    longitude: 0.824782,
    i18n_key: 'CN_TG',
    country_isd: [
      {
        id: 216,
        phone_isd: '+228',
      },
    ],
  },
  {
    id: 218,
    code: 'TH',
    name: 'Thailand',
    latitude: 15.870032,
    longitude: 100.992541,
    i18n_key: 'CN_TH',
    country_isd: [
      {
        id: 217,
        phone_isd: '+66',
      },
    ],
  },
  {
    id: 219,
    code: 'TJ',
    name: 'Tajikista',
    latitude: 38.861034,
    longitude: 71.276093,
    i18n_key: 'CN_TJ',
    country_isd: [
      {
        id: 218,
        phone_isd: '+992',
      },
    ],
  },
  {
    id: 220,
    code: 'TK',
    name: 'Tokelau',
    latitude: -8.967363,
    longitude: -171.855881,
    i18n_key: 'CN_TK',
    country_isd: [
      {
        id: 219,
        phone_isd: '+690',
      },
    ],
  },
  {
    id: 221,
    code: 'TL',
    name: 'Timor-Leste',
    latitude: -8.874217,
    longitude: 125.727539,
    i18n_key: 'CN_TL',
    country_isd: [
      {
        id: 220,
        phone_isd: '+670',
      },
    ],
  },
  {
    id: 222,
    code: 'TM',
    name: 'Turkmenista',
    latitude: 38.969719,
    longitude: 59.556278,
    i18n_key: 'CN_TM',
    country_isd: [
      {
        id: 221,
        phone_isd: '+993',
      },
    ],
  },
  {
    id: 223,
    code: 'TN',
    name: 'Tunisia',
    latitude: 33.886917,
    longitude: 9.537499,
    i18n_key: 'CN_TN',
    country_isd: [
      {
        id: 222,
        phone_isd: '+216',
      },
    ],
  },
  {
    id: 224,
    code: 'TO',
    name: 'Tonga',
    latitude: -21.178986,
    longitude: -175.198242,
    i18n_key: 'CN_TO',
    country_isd: [
      {
        id: 223,
        phone_isd: '+676',
      },
    ],
  },
  {
    id: 225,
    code: 'TR',
    name: 'Türkiye',
    latitude: 38.963745,
    longitude: 35.243322,
    i18n_key: 'CN_TR',
    country_isd: [
      {
        id: 224,
        phone_isd: '+90',
      },
    ],
  },
  {
    id: 226,
    code: 'TT',
    name: 'Trinidad and Tobago',
    latitude: 10.691803,
    longitude: -61.222503,
    i18n_key: 'CN_TT',
    country_isd: [
      {
        id: 225,
        phone_isd: '+1-868',
      },
    ],
  },
  {
    id: 227,
    code: 'TV',
    name: 'Tuvalu',
    latitude: -7.109535,
    longitude: 177.64933,
    i18n_key: 'CN_TV',
    country_isd: [
      {
        id: 226,
        phone_isd: '+688',
      },
    ],
  },
  {
    id: 228,
    code: 'TW',
    name: 'Taiwan, Province of China',
    latitude: 23.69781,
    longitude: 120.960515,
    i18n_key: 'CN_TW',
    country_isd: [
      {
        id: 227,
        phone_isd: '+886',
      },
    ],
  },
  {
    id: 229,
    code: 'TZ',
    name: 'Tanzania, United Republic of',
    latitude: -6.369028,
    longitude: 34.888822,
    i18n_key: 'CN_TZ',
    country_isd: [
      {
        id: 228,
        phone_isd: '+255',
      },
    ],
  },
  {
    id: 230,
    code: 'UA',
    name: 'Ukraine',
    latitude: 48.379433,
    longitude: 31.16558,
    i18n_key: 'CN_UA',
    country_isd: [
      {
        id: 229,
        phone_isd: '+380',
      },
    ],
  },
  {
    id: 231,
    code: 'UG',
    name: 'Uganda',
    latitude: 1.373333,
    longitude: 32.290275,
    i18n_key: 'CN_UG',
    country_isd: [
      {
        id: 230,
        phone_isd: '+256',
      },
    ],
  },
  {
    id: 232,
    code: 'UM',
    name: 'United States Minor Outlying Islands',
    i18n_key: 'CN_UM',
    country_isd: [
      {
        id: 231,
        phone_isd: '+1-664',
      },
    ],
  },
  {
    id: 233,
    code: 'US',
    name: 'United States of America',
    latitude: 37.09024,
    longitude: -95.712891,
    i18n_key: 'CN_US',
    country_isd: [
      {
        id: 232,
        phone_isd: '+1',
      },
    ],
  },
  {
    id: 234,
    code: 'UY',
    name: 'Uruguay',
    latitude: -32.522779,
    longitude: -55.765835,
    i18n_key: 'CN_UY',
    country_isd: [
      {
        id: 233,
        phone_isd: '+598',
      },
    ],
  },
  {
    id: 235,
    code: 'UZ',
    name: 'Uzbekista',
    latitude: 41.377491,
    longitude: 64.585262,
    i18n_key: 'CN_UZ',
    country_isd: [
      {
        id: 234,
        phone_isd: '+998',
      },
    ],
  },
  {
    id: 236,
    code: 'VA',
    name: 'Holy See',
    latitude: 41.902916,
    longitude: 12.453389,
    i18n_key: 'CN_VA',
    country_isd: [
      {
        id: 235,
        phone_isd: '+379',
      },
    ],
  },
  {
    id: 237,
    code: 'VC',
    name: 'Saint Vincent and the Grenadines',
    latitude: 12.984305,
    longitude: -61.287228,
    i18n_key: 'CN_VC',
    country_isd: [
      {
        id: 236,
        phone_isd: '+1-784',
      },
    ],
  },
  {
    id: 238,
    code: 'VE',
    name: 'Venezuela (Bolivarian Republic of)',
    latitude: 6.42375,
    longitude: -66.58973,
    i18n_key: 'CN_VE',
    country_isd: [
      {
        id: 237,
        phone_isd: '+58',
      },
    ],
  },
  {
    id: 239,
    code: 'VG',
    name: 'Virgin Islands (British)',
    latitude: 18.420695,
    longitude: -64.639968,
    i18n_key: 'CN_VG',
    country_isd: [
      {
        id: 238,
        phone_isd: '+1-284',
      },
    ],
  },
  {
    id: 240,
    code: 'VI',
    name: 'Virgin Islands (U.S.)',
    latitude: 18.335765,
    longitude: -64.896335,
    i18n_key: 'CN_VI',
    country_isd: [
      {
        id: 239,
        phone_isd: '+1-340',
      },
    ],
  },
  {
    id: 241,
    code: 'VN',
    name: 'Viet Nam',
    latitude: 14.058324,
    longitude: 108.277199,
    i18n_key: 'CN_VN',
    country_isd: [
      {
        id: 240,
        phone_isd: '+84',
      },
    ],
  },
  {
    id: 242,
    code: 'VU',
    name: 'Vanuatu',
    latitude: -15.376706,
    longitude: 166.959158,
    i18n_key: 'CN_VU',
    country_isd: [
      {
        id: 241,
        phone_isd: '+678',
      },
    ],
  },
  {
    id: 243,
    code: 'WF',
    name: 'Wallis and Futuna',
    latitude: -13.768752,
    longitude: -177.156097,
    i18n_key: 'CN_WF',
    country_isd: [
      {
        id: 242,
        phone_isd: '+681',
      },
    ],
  },
  {
    id: 244,
    code: 'WS',
    name: 'Samoa',
    latitude: -13.759029,
    longitude: -172.104629,
    i18n_key: 'CN_WS',
    country_isd: [
      {
        id: 243,
        phone_isd: '+685',
      },
    ],
  },
  {
    id: 245,
    code: 'YE',
    name: 'Yeme',
    latitude: 15.552727,
    longitude: 48.516388,
    i18n_key: 'CN_YE',
    country_isd: [
      {
        id: 244,
        phone_isd: '+967',
      },
    ],
  },
  {
    id: 246,
    code: 'YT',
    name: 'Mayotte',
    latitude: -12.8275,
    longitude: 45.166244,
    i18n_key: 'CN_YT',
    country_isd: [
      {
        id: 245,
        phone_isd: '+262',
      },
    ],
  },
  {
    id: 247,
    code: 'ZA',
    name: 'South Africa',
    latitude: -30.559482,
    longitude: 22.937506,
    i18n_key: 'CN_ZA',
    country_isd: [
      {
        id: 246,
        phone_isd: '+27',
      },
    ],
  },
  {
    id: 248,
    code: 'ZM',
    name: 'Zambia',
    latitude: -13.133897,
    longitude: 27.849332,
    i18n_key: 'CN_ZM',
    country_isd: [
      {
        id: 247,
        phone_isd: '+260',
      },
    ],
  },
  {
    id: 249,
    code: 'ZW',
    name: 'Zimbabwe',
    latitude: -19.015438,
    longitude: 29.154857,
    i18n_key: 'CN_ZW',
    country_isd: [
      {
        id: 248,
        phone_isd: '+263',
      },
    ],
  },
]

const getCountryByCode = (code: string) => {
  return countries.find(
    (country) => country.code?.toLocaleLowerCase() === code.toLowerCase(),
  )
}

const getCountryByIsd = (isd: string) => {
  return countries.find((country) =>
    country.country_isd?.some((isdItem) => isdItem.phone_isd === isd),
  )
}

export default countries
export { countries, getCountryByCode, getCountryByIsd }
