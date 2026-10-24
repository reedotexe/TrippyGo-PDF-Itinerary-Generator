const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'sample-itineraries');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const samples = [
  {
    filename: '01_kashmir_6n7d_paradise_supplier.txt',
    content: `SUPPLIER: Royal Kashmir Holidays Pvt Ltd
REF: RKH-2026-OCT-884
DESTINATION: Srinagar - Gulmarg - Pahalgam - Sonamarg
DURATION: 6 Nights / 7 Days

DAY 1: ARRIVAL SRINAGAR - LOCAL SIGHTSEEING
Meet & greet at Srinagar airport by driver. Transfer to luxury houseboat at Dal Lake.
Afternoon Shikara ride visiting Floating Gardens, Char Chinar, and Nehru Park.
Dinner & overnight stay at Houseboat (Dal Lake).

DAY 2: SRINAGAR TO SONAMARG DAY EXCURSION (85 KMS / 3 HRS ONE WAY)
After breakfast drive to Sonamarg (Meadow of Gold). Enjoy Thajiwas Glacier pony ride (direct payment).
Return to Srinagar hotel in evening.
Dinner & overnight stay at Hotel Grand Boulevard, Srinagar.

DAY 3: SRINAGAR - GULMARG (52 KMS / 2 HRS)
Post breakfast proceed to Gulmarg (Meadow of Flowers).
Board Gulmarg Gondola Phase 1 & Phase 2 up to Apharwat Peak.
Snow activities and golf course visit.
Dinner & overnight stay at Hotel Pine Spring, Gulmarg.

DAY 4: GULMARG TO PAHALGAM (140 KMS / 4 HRS)
Drive to Pahalgam via Pampore saffron fields and Awantipora ruins.
Check-in to resort by Lidder River. Evening at leisure walking along riverbank.
Dinner & overnight stay at Hotel Heevan, Pahalgam.

DAY 5: PAHALGAM VALLEY SIGHTSEEING
Visit Betaab Valley, Aru Valley, and Chandanwari by local union cab.
Afternoon river rafting at Lidder (optional).
Dinner & overnight stay at Hotel Heevan, Pahalgam.

DAY 6: PAHALGAM TO SRINAGAR (95 KMS / 2.5 HRS)
Return drive to Srinagar. Visit Mughal Gardens: Nishat Bagh, Shalimar Bagh, Chashme Shahi, and Shankaracharya Temple.
Shopping at Lal Chowk for Pashmina and dry fruits.
Dinner & overnight stay at Hotel Grand Boulevard, Srinagar.

DAY 7: DEPARTURE SRINAGAR AIRPORT
Breakfast at hotel. Private transfer to Srinagar Airport for onward flight. Tour ends.

INCLUSIONS:
- 01 Night Deluxe Houseboat Srinagar
- 02 Nights Hotel Grand Boulevard Srinagar (Deluxe Room)
- 01 Night Hotel Pine Spring Gulmarg (Deluxe Room)
- 02 Nights Hotel Heevan Pahalgam (Deluxe Room)
- Daily Breakfast and Dinner (MAPAI plan)
- All transfers and sightseeing by private Innova Crysta
- 01 Hour complimentary Shikara ride
- Tolls, parking, driver night charges, fuel

EXCLUSIONS:
- Airfare / train fare
- Gondola tickets Phase 1 & 2 (client to book online)
- Union taxi for Aru/Betaab/Chandanwari in Pahalgam (approx INR 2500 per cab)
- Pony rides, sledging, ski equipment
- GST 5% extra if billed to end client

NET SUPPLIER PRICE:
INR 52,000/- Total for 2 Pax (INR 26,000 per person)
Net Net non-commissionable.`
  },
  {
    filename: '02_goa_3n4d_beach_supplier.txt',
    content: `GOA B2B DESTINATION EXPERTS
Quotation Ref: GB2B/GOA/2026/102

Package: North & South Goa Leisure Break
Duration: 3 Nights / 4 Days
Pax: 2 Adults

Day 1: Arrival at MOPA / Dabolim Airport. Private AC Sedan pick up and transfer to Resort Terra Paraiso, Calangute. Rest of the day free for beach leisure. Overnight at hotel.
Day 2: North Goa Tour - Fort Aguada, Sinquerim Beach, Anjuna Beach, Vagator Beach & Chapora Fort viewpoint. Watersports at Calangute (direct pay). Overnight at hotel.
Day 3: South Goa Tour - Basilica of Bom Jesus, Se Cathedral, Mangueshi Temple, Miramar Beach, evening 1-hr Mandovi river cruise. Overnight at hotel.
Day 4: Breakfast, check-out and private transfer to airport.

Hotels:
Resort Terra Paraiso Calangute (Superior Deluxe AC Room with Balcony)
Meal Plan: CP (Breakfast only)

Inclusions:
- 3 Nights accommodation
- Daily buffet breakfast
- Airport pick up and drop by AC Dzire
- 2 days sightseeing as mentioned
- Mandovi cruise ticket for 2

Exclusions:
- Lunch, dinner, personal drinks
- Watersports, monument entry fees
- Flight tickets

Net Rate: INR 19,500 Total for couple net.`
  },
  {
    filename: '03_kerala_5n6d_backwaters_supplier.txt',
    content: `God's Own DMC Cochin
Quote ID: KRL-56-OCT26

Tour: Munnar - Thekkady - Alleppey
Nights: 5N / 6D

ITINERARY:
Day 01: Cochin to Munnar (130 km / 4 hrs). En-route Cheeyappara & Valara waterfalls. Tea plantation view. Check-in at Blanket Luxury Resort Munnar. Overnight Munnar.
Day 02: Munnar Sightseeing - Eravikulam National Park (Nilgiri Tahr), Mattupetty Dam, Echo Point, Tea Museum. Overnight Blanket Resort.
Day 03: Munnar to Thekkady (90 km / 3 hrs). Spice plantation tour, Periyar Wildlife Sanctuary boating. Evening Kathakali & Kalaripayattu martial art show. Overnight Elephant Court, Thekkady.
Day 04: Thekkady to Alleppey (140 km / 4 hrs). Board 1-Bedroom Private Deluxe Houseboat at 12:00 PM. Cruise through Vembanad Lake and narrow canals. All meals on board (Lunch, evening tea snacks, dinner, breakfast). Overnight in Houseboat.
Day 05: Alleppey to Marari Beach (30 km / 45 mins). Check-in at Marari Beach Resort. Afternoon relax by the white sand beach. Overnight Marari.
Day 06: Check out and transfer to Cochin Airport (75 km / 2 hrs).

Pricing & Inclusions:
- 2N Munnar (Blanket Resort), 1N Thekkady (Elephant Court), 1N Alleppey Houseboat, 1N Marari
- Daily breakfast at hotels, all meals on houseboat
- AC Sedan for all 6 days with English/Hindi speaking driver
- Net Supplier Price: INR 44,000 for 2 Adults.`
  },
  {
    filename: '04_bali_6n7d_dmc_quote.txt',
    content: `BALI SUNSHINE DMC DENPASAR
B2B Package: Best of Bali Deluxe
Duration: 6N / 7D (3N Ubud Villa + 3N Seminyak Hotel)

ITINERARY:
Day 1: DPS Airport Arrival. Private welcome with flower garland. Transfer to Ubud Private Pool Villa (Dedary Resort).
Day 2: Kintamani Volcano, Tegalalang Rice Terrace, Bali Swing with local lunch, Tirta Empul Holy Water Temple, Ubud Monkey Forest.
Day 3: Ulun Danu Beratan Lake Temple, Handara Gate, Wanagiri Hidden Hills, Tanah Lot Sunset Temple.
Day 4: Check out Ubud. Transfer to Seminyak hotel (The Haven Seminyak). En-route visit Celuk silversmith village. Evening free to explore Seminyak beach clubs.
Day 5: Nusa Penida West Island Tour by fast boat: Kelingking T-Rex Beach, Broken Beach, Angel's Billabong, Crystal Bay. Local Indonesian lunch included.
Day 6: Water Sports at Tanjung Benoa (1x Banana Boat, 1x Jet Ski). Evening Uluwatu Cliff Temple with Kecak Fire Dance performance.
Day 7: Breakfast, checkout. Drop to Ngurah Rai International Airport.

Inclusions:
- 3N Ubud Private Pool Villa + 3N Seminyak 4-star
- Daily breakfast + 2 local set lunches
- Private AC APV/Avanza with English speaking driver
- Return fast boat Nusa Penida + island transport
- All entrance tickets and water sports listed

Exclusions:
- Bali Tourist Tax ($10/pax), Visa on Arrival (IDR 500,000)
- International flights

Net Rate to Agent: USD 480 per person (Twin share basis) / INR 40,320 per person equivalent.`
  },
  {
    filename: '05_dubai_4n5d_dmc_quote.txt',
    content: `AL KHALEEJ TOURS & DMC DUBAI
B2B Reference: AKT-DXB-4N5D-1026

Duration: 4 Nights / 5 Days
Hotel: Fortune Karama Hotel / Citymax Bur Dubai 3* or upgrade to Aloft Al Mina 4*

Day 1: Arrival Dubai Airport (DXB). Meet & greet, transfer to hotel. Evening 8:00 PM Marina Dhow Cruise with international buffet dinner, tanoura dance, and live music.
Day 2: Half Day Dubai City Tour (Dubai Frame photo stop, Jumeirah Mosque, Burj Al Arab photo stop, Atlantis The Palm). Afternoon Burj Khalifa 124th Floor (Non-peak slot) with Dubai Mall Fountain Show.
Day 3: Morning at leisure for shopping at Gold & Spice Souk. Afternoon 3:00 PM Desert Safari with Dune Bashing, Camel Ride, Sandboarding, Belly Dance, Tanoura Show, and BBQ Dinner.
Day 4: Visit Museum of the Future (entry slot included). Evening visit Global Village + Miracle Garden.
Day 5: Breakfast at hotel. Check out. Private transfer to Dubai International Airport.

Net Package Cost:
Option A (3* Hotel): AED 1,280 / INR 29,440 per person (Min 2 pax)
Option B (4* Hotel): AED 1,550 / INR 35,650 per person

Inclusions: 4N hotel with breakfast, shared SIC tours & transfers, private airport transfers, all listed entry tickets.
Exclusions: Tourism Dirham fee (AED 15/room/night direct to hotel), UAE Visa + OTB, Flight tickets.`
  },
  {
    filename: '06_rajasthan_7n8d_heritage_supplier.txt',
    content: `MARWAR HERITAGE TRAVELS JAIPUR
Package: Royal Rajasthan Circuit (Jaipur - Jodhpur - Udaipur)
Duration: 7 Nights / 8 Days

Itinerary:
Day 1: Arrival Jaipur. Transfer to Hotel Mandawa Haveli. Evening visit Chokhi Dhani ethnic village resort.
Day 2: Full day Jaipur: Amber Fort (elephant/jeep ride), Jal Mahal, City Palace, Jantar Mantar, Hawa Mahal.
Day 3: Jaipur to Jodhpur (330 km / 6 hrs) via Ajmer Dargah & Pushkar Brahma Temple. Overnight Hotel Devi Bhawan, Jodhpur.
Day 4: Jodhpur Sightseeing: Mehrangarh Fort, Jaswant Thada, Umaid Bhawan Palace museum. Afternoon drive to Udaipur (260 km / 5 hrs) visiting Ranakpur Jain Temple en-route. Overnight Hotel Fateh Niwas, Udaipur.
Day 5: Udaipur: City Palace, Jagdish Temple, Saheliyon Ki Bari, evening motor boat ride on Lake Pichola. Overnight Udaipur.
Day 6: Day excursion to Kumbhalgarh Fort (second longest wall in the world) and Haldighati. Overnight Udaipur.
Day 7: Udaipur local markets, Bagore Ki Haveli folk dance show. Overnight Udaipur.
Day 8: Transfer to Udaipur Airport (UDR) for departure.

Commercials:
Inclusions: 2N Jaipur, 1N Jodhpur, 4N Udaipur on CP (Breakfast only). AC Etios car with fuel, driver allowance, tolls.
Net Price: INR 58,000 for 2 adults (INR 29,000/person).
Exclusions: Fort entrance tickets, camera fees, boat ride ticket.`
  },
  {
    filename: '07_himachal_5n6d_shimla_manali.txt',
    content: `HIMALAYAN ESCAPES CHANDIGARH
Itinerary: Shimla Manali Volvo & Cab Combo
Duration: 5 Nights / 6 Days

Day 1: Delhi to Shimla overnight Volvo. Morning arrive Shimla, check in Hotel Willow Banks. Afternoon Kufri excursion & Mall road walk.
Day 2: Shimla to Manali (250 km / 7 hrs) via Pandoh Dam, Kullu valley shawl factory, and river rafting point. Overnight Hotel Snow Valley Resorts Manali.
Day 3: Solang Valley adventure day (paragliding, zorbing, zipline) & Atal Tunnel Sissu valley excursion. Overnight Manali.
Day 4: Local Manali: Hadimba Devi Temple, Vashisht Hot Springs, Tibetan Monastery, Van Vihar. Overnight Manali.
Day 5: Morning free at Mall Road Manali. 4:30 PM drop at Volvo bus stand. Overnight journey to Delhi.
Day 6: Morning 7:00 AM arrive Kashmiri Gate Delhi.

Net B2B Price: INR 22,500 total for 2 pax.
Includes: Semi-sleeper AC Volvo Delhi-Shimla & Manali-Delhi, 1N Shimla, 3N Manali on MAP (Breakfast + Dinner), private Alto/Dzire for all local sightseeing.`
  },
  {
    filename: '08_vietnam_8n9d_hanoi_danang_saigon.txt',
    content: `INDOCHINA HORIZONS DMC HANOI
Tour: Highlights of Vietnam Across 3 Regions
Duration: 8 Nights / 9 Days (Hanoi - Halong Bay - Da Nang - Hoi An - Ho Chi Minh)

Day 1: Arrive Hanoi (HAN). Airport transfer. Overnight Silk Path Hotel Hanoi.
Day 2: Hanoi city tour (Ho Chi Minh Mausoleum, One Pillar Pagoda, Temple of Literature, Old Quarter cyclos). Overnight Hanoi.
Day 3: Hanoi to Halong Bay. Board 5* Orchid Cruise Halong Bay. Kayaking in Lan Ha Bay, cave exploration, cooking demo. All meals on board. Overnight cruise.
Day 4: Morning Tai Chi on sundeck, cruise back to port. Transfer to Hanoi airport for flight to Da Nang. Transfer to Hoi An Historic Hotel.
Day 5: Ba Na Hills & Golden Bridge (Hands of God) full day tour with cable car and buffet lunch. Overnight Hoi An.
Day 6: Hoi An Ancient Town walking tour, Cam Thanh coconut basket boat tour with crab fishing. Overnight Hoi An.
Day 7: Transfer to Da Nang airport for flight to Ho Chi Minh City (Saigon). Afternoon Cu Chi Tunnels tour. Overnight Edenstar Saigon Hotel.
Day 8: Full day Mekong Delta tour (My Tho & Ben Tre): boat cruise, fruit orchards, honey farm, traditional music. Overnight Saigon.
Day 9: Breakfast, check out. Transfer to Tan Son Nhat Airport (SGN).

Net B2B Rate: USD 650 / person (INR 54,600/person) based on twin share.
Exclusions: Domestic flights (HAN-DAD & DAD-SGN approx $75 each), Vietnam Visa approval letter ($15).`
  },
  {
    filename: '09_thailand_4n5d_phuket_krabi_whatsapp.txt',
    content: `*FORWARDED WHATSAPP SUPPLIER QUOTE*
From: Bobby Phuket DMC (+66 81 234 5678)
To: TrippyGo Sales Desk

Hey brother sharing special October flash deal for Phuket + Krabi 4N5D!! 🇹🇭🏖️

Day 1: HKT airport pickup -> Hotel drop Patong (Fishermen's Harbour 4* or Deevana Plaza). Evening Bangla road chill.
Day 2: Phi Phi Island speed boat tour with lunch, Maya Bay, Monkey Beach, snorkeling gear included. (SIC)
Day 3: Checkout Phuket, private road transfer to Krabi Ao Nang (approx 3 hrs). Check in Panan Krabi Resort 4*. Evening Ao Nang night market.
Day 4: 4 Island Krabi tour by Speedboat (Tup island, Chicken island, Poda island, Phra Nang cave) with picnic lunch & national park fee.
Day 5: Breakfast, check out. Private drop to Krabi Airport (KBV) for flight back.

Hotels:
2N Phuket: Fishermen's Harbour Urban Resort (Deluxe room with breakfast)
2N Krabi: Panan Krabi Resort (Deluxe pool view with breakfast)

Costing:
Total Net to you: THB 9,800 per person (approx INR 23,500/pax)
Min 2 pax required. Valid till 30 Nov 2026.
Airfare not included.`
  },
  {
    filename: '10_ladakh_6n7d_bike_suv_supplier.txt',
    content: `PEAK LADAKH ADVENTURES LEH
Ref: PLA-LDK-6N7D-26

Tour: Leh - Sham Valley - Nubra Valley - Turtuk - Pangong Lake
Duration: 6 Nights / 7 Days

Day 1: Arrival Leh Kushok Bakula Rimpochee Airport (3500m). Full day rest for acclimatization. Evening walk to Leh Market & Shanti Stupa. Overnight Hotel The Grand Dragon / Spic N Span Leh.
Day 2: Sham Valley Sightseeing: Hall of Fame, Magnetic Hill, Gurudwara Pathar Sahib, Sangam (Indus & Zanskar confluence). Overnight Leh.
Day 3: Leh to Nubra Valley (125 km / 5 hrs) via Khardung La Pass (5359m - world's highest motorable pass). Diskit Monastery & Hunder sand dunes double-humped camel safari. Overnight Apple Nubra Cottage, Hunder.
Day 4: Day excursion to Turtuk Village (Balti culture, last village before LOC). Return to Hunder. Overnight Nubra.
Day 5: Nubra to Pangong Tso Lake (160 km / 6 hrs) via Shyok River route. Witness color changing lake. Overnight Deluxe Camp at Pangong (Spangmik).
Day 6: Pangong sunrise. Drive back to Leh via Chang La Pass (5360m). Visit Thiksey Monastery & Shey Palace. Overnight Leh.
Day 7: Drop to Leh Airport for departure flight.

Net Supplier Quote:
INR 38,000 per person (Min 4 pax in private Scorpio/Innova)
Includes: 3N Leh, 2N Nubra, 1N Pangong Camp. MAP plan (Breakfast + Dinner). Oxygen cylinder in cab, Inner Line Permits, Wildlife & Environment fees.`
  },
  {
    filename: '11_andaman_4n5d_portblair_havelock.txt',
    content: `EMERALD ISLANDS DMC PORT BLAIR
Duration: 4 Nights / 5 Days
Destinations: Port Blair (2N) + Havelock Island (2N)

Day 1: Arrival Port Blair. Transfer to Symphony Samudra Resort. Afternoon visit Cellular Jail followed by the Light & Sound Show. Overnight Port Blair.
Day 2: Private Makruzz / Nautika high-speed catamaran ferry to Havelock Island. Check-in at Symphony Palms Beach Resort. Afternoon visit to world famous Radhanagar Beach (Beach No. 7) for spectacular sunset. Overnight Havelock.
Day 3: Elephant Beach excursion by private speed boat. Included 1 complimentary snorkeling session. Coral reef watching. Evening at Kalapathar Beach. Overnight Havelock.
Day 4: Morning ferry back to Port Blair. Visit Chidiya Tapu (Sunset Point) and local handicraft emporium Sagarika. Overnight Port Blair.
Day 5: Airport drop to Veer Savarkar International Airport, Port Blair.

Package Rate: INR 28,500 per person (Twin sharing).
Includes: Hotels on CP, all private transfers, luxury ferry tickets, speed boat to Elephant beach, entry tickets.`
  },
  {
    filename: '12_singapore_malaysia_6n7d_cruise.txt',
    content: `LION CITY & MALAYSIA DMC B2B
Package: Singapore City + Genting Dream Cruise + Kuala Lumpur
Nights: 6N / 7D

Day 1: Arrival Changi Airport. Transfer to Hotel Boss Singapore. Evening Night Safari with tram ride.
Day 2: Half day Singapore City tour (Merlion Park, Chinatown, Little India) + afternoon Sentosa Island (Cable car, Madame Tussauds, Wings of Time).
Day 3: Gardens by the Bay (Flower Dome + Cloud Forest + Supertree observatory). 4:00 PM transfer to Marina Bay Cruise Centre. Board Genting Dream Cruise (Balcony Stateroom). All meals on board.
Day 4: Cruise calls at Port Klang (Kuala Lumpur). Disembark and visit Batu Caves & Petronas Twin Towers. Reboard cruise.
Day 5: Cruise high seas fun. 10:00 AM arrive back Singapore. Transfer to hotel. Evening Marina Bay Sands Skypark observation deck.
Day 6: Universal Studios Singapore full day pass with all rides.
Day 7: Morning Jewel Changi Airport vortex waterfall visit. Flight departure.

Net Price: SGD 980 / INR 61,740 per person (Twin share). Cruise gratuity SGD 22/pax/night payable on board.`
  },
  {
    filename: '13_bhutan_5n6d_paro_thimphu.txt',
    content: `DRUK KINGDOM TOURS THIMPHU
Bhutan Cultural Heritage
Duration: 5 Nights / 6 Days (2N Thimphu + 1N Punakha + 2N Paro)

Day 1: Arrive Paro International Airport. Scenic 1.5 hr drive to Thimphu. Visit Buddha Dordenma (Giant Buddha statue), National Memorial Chorten. Overnight Hotel Druk Thimphu.
Day 2: Thimphu to Punakha via Dochula Pass (108 chortens and Himalayan panorama). Visit Punakha Dzong and suspension bridge. Overnight Zangto Pelri Hotel Punakha.
Day 3: Punakha to Paro. Visit National Museum (Ta Dzong) and Rinpung Dzong. Overnight Le Meridien / Raven's Nest Paro.
Day 4: Paro - Hike to Taktsang Monastery (Tiger's Nest) clinging to a 900m granite cliff. Hot stone bath in evening. Overnight Paro.
Day 5: Excursion to Chele La Pass (highest pass in Bhutan at 3988m). Evening shopping in Paro town.
Day 6: Transfer to Paro Airport for Drukair / Bhutan Airlines flight.

Costing:
Net Supplier Quote: INR 48,000 per person.
Includes: 3-star standard heritage hotels, all meals (AP plan - B/L/D), private Hyundai Tucson / HiAce with English speaking certified Bhutanese guide, Sustainable Development Fee (SDF) of INR 1,200 per person per night for Indian nationals.`
  },
  {
    filename: '14_sikkim_darjeeling_5n6d_northeast.txt',
    content: `KANCHANJUNGA TRAVELS SILIGURI
North East Splendor: Gangtok (3N) & Darjeeling (2N)
5N / 6D

Day 1: Pick up from Bagdogra Airport (IXB) / NJP Railway station. Drive to Gangtok (125 km / 4.5 hrs). Check in Hotel Lemon Tree Gangtok. Evening MG Marg walk.
Day 2: Full day excursion to Tsomgo Lake (12,400 ft) and Baba Harbhajan Singh Mandir. (Nathula Pass subject to permit). Overnight Gangtok.
Day 3: Gangtok to Darjeeling (100 km / 4 hrs) via Peshok tea gardens and Teesta river view. Check in Mayfair Darjeeling / Windamere.
Day 4: Early morning 4:00 AM trip to Tiger Hill for Kanchenjunga sunrise. Visit Ghoom Monastery and Batasia Loop. Afternoon Himalayan Mountaineering Institute (HMI), P.N. Zoo, and Darjeeling Ropeway.
Day 5: Joy ride on world heritage Darjeeling Himalayan Railway (Toy Train steam engine). Afternoon visit Happy Valley Tea Estate.
Day 6: Check out, drive down to Bagdogra airport (70 km / 3 hrs).

Net B2B Price: INR 31,500 per person (Twin share in private Innova). Meal Plan: MAP (Breakfast & Dinner).`
  },
  {
    filename: '15_char_dham_11n12d_pilgrimage.txt',
    content: `UTTARAKHAND DEV BHOOMI YATRA
Sacred Char Dham Yatra (Yamunotri, Gangotri, Kedarnath, Badrinath)
Duration: 11 Nights / 12 Days ex-Haridwar

Day 1: Haridwar to Barkot via Mussoorie & Kempty Falls (220 km / 7 hrs). Overnight Barkot.
Day 2: Barkot - Yamunotri - Barkot (36 km drive + 6 km trek each side). Overnight Barkot.
Day 3: Barkot to Uttarkashi (100 km / 4 hrs). Visit Kashi Vishwanath Temple. Overnight Uttarkashi.
Day 4: Uttarkashi - Gangotri - Uttarkashi (100 km each side). Holy dip in Bhagirathi river. Overnight Uttarkashi.
Day 5: Uttarkashi to Guptkashi / Sitapur (220 km / 8 hrs). Overnight Sitapur.
Day 6: Sitapur to Kedarnath (drive to Sonprayag, trek 19 km or option for Phata helicopter). Evening Kedarnath temple darshan & aarti. Overnight Kedarnath GMVN / tent.
Day 7: Morning darshan. Trek down to Sonprayag. Drive back to Guptkashi. Overnight Guptkashi.
Day 8: Guptkashi to Badrinath (190 km / 7 hrs) via Joshimath. Evening temple darshan. Overnight Badrinath.
Day 9: Badrinath morning bath in Tapt Kund. Visit Mana village (last Indian village, Vyas Gufa, Bhim Pul). Drive to Pipalkoti (80 km). Overnight Pipalkoti.
Day 10: Pipalkoti to Rishikesh (220 km / 7 hrs). Visit Ram Jhula, Laxman Jhula, Triveni Ghat Ganga Aarti. Overnight Rishikesh.
Day 11: Rishikesh day at leisure / river rafting. Overnight Rishikesh.
Day 12: Morning transfer to Haridwar railway station.

Net Supplier Rate: INR 38,500 per person (Min 4 pax in private Bolero/Innova). MAPAI meals.`
  },
  {
    filename: '16_maldives_3n4d_water_villa.txt',
    content: `SUN ISLAND RESORTS & MALDIVES DMC
Resort: Centara Ras Fushi Resort & Spa Maldives (Adults Only)
Stay: 3 Nights Deluxe Water Villa

Day 1: Arrive Male Velana International Airport (MLE). Greet by resort airport representative. Speedboat transfer (20 minutes) to resort island. Welcome drinks and check-in to Ocean Front Water Villa.
Day 2: Full day resort relaxation. Complimentary non-motorized watersports (kayak, paddleboard, snorkeling gear). Evening sunset cocktail.
Day 3: Optional guided house-reef snorkeling to see sea turtles and reef sharks. Spa treatment discount.
Day 4: Breakfast, check out. Speedboat return transfer to Male airport.

Meal Plan: All Inclusive (Breakfast, Lunch, Dinner, afternoon tea, unlimited alcoholic & non-alcoholic beverages).

Net Rate for 2 Adults:
Total USD 1,950 (approx INR 1,63,800 total for couple).
Includes: 3N Water Villa, return speedboat transfers, all taxes (16% TGST + Green Tax $6/person/night).`
  },
  {
    filename: '17_europe_10n11d_swiss_paris.txt',
    content: `EUROPATRAILS DMC GENEVA
Grand Swiss Alps & Romantic Paris
10 Nights / 11 Days (4N Paris + 3N Interlaken + 3N Lucerne)

Day 1: Arrive Paris CDG. Private transfer to Mercure Paris Centre Eiffel Tower 4*.
Day 2: Paris panoramic city tour: Louvre Museum priority access, Notre Dame, Champs Elysees, Arc de Triomphe. Evening Seine River cruise with Champagne.
Day 3: Eiffel Tower 3rd Level (Summit) access + afternoon excursion to Palace of Versailles.
Day 4: Free day in Paris for shopping at Galeries Lafayette.
Day 5: TGV Lyria High-speed train from Paris Gare de Lyon to Basel / Interlaken. Check in Hotel Interlaken.
Day 6: Excursion to Jungfraujoch - Top of Europe (3454m) via Eiger Express tri-cable gondola. Ice Palace and Sphinx observatory.
Day 7: Day trip to Grindelwald First with Cliff Walk and Lake Brienz steamboat cruise.
Day 8: Scenic GoldenPass train from Interlaken to Lucerne. Check in Hotel Schweizerhof Luzern. Chapel Bridge and Lion Monument.
Day 9: Mount Titlis revolving Rotair cable car with Ice Flyer chairlift and Glacier Cave.
Day 10: Lake Lucerne scenic catamaran cruise. Afternoon free for Swiss chocolates and watch shopping.
Day 11: Transfer to Zurich Airport (ZRH) by train for departure flight.

Net Supplier Rate: EUR 1,890 / INR 1,73,880 per person (Twin share).
Includes: 4-star hotels, daily buffet breakfast, 1st class Swiss Travel Pass 8 consecutive days, all mountain excursions.`
  },
  {
    filename: '18_sri_lanka_5n6d_ramayana_trail.txt',
    content: `CEYLON DISCOVERY TRAVELS COLOMBO
Sri Lanka Scenic & Cultural Tour
5 Nights / 6 Days (1N Negombo + 2N Kandy + 1N Nuwara Eliya + 1N Bentota)

Day 1: Arrive Colombo Bandaranaike Airport (CMB). Transfer to Jetwing Blue Negombo. Beach walk.
Day 2: Negombo to Kandy via Pinnawala Elephant Orphanage. Visit Temple of the Sacred Tooth Relic and cultural dance show. Overnight Grand Kandyan Hotel.
Day 3: Kandy to Nuwara Eliya (Little England) scenic drive through tea hills. Visit Ramboda Waterfalls and Damro tea factory. Overnight Heritance Tea Factory.
Day 4: Nuwara Eliya to Bentota beach via Seetha Amman Temple and kitulgala white water rafting. Overnight Cinnamon Bey Beruwala.
Day 5: Bentota: Madu Ganga mangrove boat safari with fish therapy, Kosgoda Turtle Hatchery, water sports. Overnight Bentota.
Day 6: Colombo brief city tour & shopping at Odel. Transfer to Colombo airport.

Net Rate: USD 340 / INR 28,560 per person (Twin share, min 2 pax).
Includes: 4-star hotels with breakfast & dinner, private AC car with English-speaking chauffeur guide.`
  },
  {
    filename: '19_meghalaya_4n5d_shillong_cherrapunji.txt',
    content: `ABODE OF CLOUDS TOURS GUWAHATI
Enchanting Meghalaya
4 Nights / 5 Days (2N Shillong + 2N Cherrapunji)

Day 1: Pick up Guwahati Airport (GAU). En-route Umiam Lake (Barapani) water sports viewpoint. Check in Polo Towers Shillong. Evening Police Bazaar stroll.
Day 2: Shillong to Cherrapunji (Sohra). Visit Elephant Falls, Mawkdok Dympep Valley Viewpoint, Nohkalikai Falls (tallest plunge waterfall), Mawsmai Limestone Cave, and Seven Sisters Falls. Overnight Polo Orchid Resort Cherrapunji.
Day 3: Trek to the Double Decker Living Root Bridge at Nongriat village (3500 steps trek with local guide) and Rainbow Falls. Overnight Cherrapunji.
Day 4: Excursion to Dawki (Umngot River crystal clear boat ride) and Mawlynnong (cleanest village in Asia) with single root bridge. Return to Shillong. Overnight Shillong.
Day 5: Check out, visit Kamakhya Devi Temple in Guwahati. Drop at Guwahati Airport.

Net B2B Price: INR 26,000 per person for 2 pax in private Dzire. MAP plan (Breakfast & Dinner).`
  },
  {
    filename: '20_uttarakhand_4n5d_rishikesh_mussoorie_whatsapp.txt',
    content: `*WHATSAPP RAW QUOTATION FROM LOCAL VENDOR*
From: Pahadi Safar Dehradun (+91 97190 XXXXX)
Date: 23 Oct 2026

Bhaiya ye Rishikesh + Mussoorie package quote hai:
Total 4N / 5D

2N Rishikesh (Camp Ganga View Shivpuri with pool)
2N Mussoorie (Hotel Fortune Grace / Jaypee downgrade option)

Plan:
Day 1: Pick from Dehradun Jolly Grant airport. Drop Shivpuri camp. Evening bonfire + snacks + Ganga beach walk. Dinner at camp.
Day 2: Morning 16 km White water river rafting from Shivpuri to NIM beach (cliff jumping included). Afternoon Beatles Ashram & Triveni ghat maha aarti. Overnight camp.
Day 3: Rishikesh to Mussoorie drive (2.5 hrs). Check in hotel. Visit Mall road, Gun hill cable car point, Library bazaar.
Day 4: Mussoorie sightseeing - Kempty falls, Company garden, George Everest peak sunset view. Night stay Mussoorie.
Day 5: Breakfast karke checkout, Dehradun drop (visit Sahastradhara on the way).

Gaadi: Private Dzire full trip.
Total Net: Rs 27,000 for 2 person (Rs 13,500/head). Rafting included. Mussoorie only breakfast, Rishikesh breakfast+dinner.`
  }
];

samples.forEach(s => {
  fs.writeFileSync(path.join(targetDir, s.filename), s.content.trim(), 'utf8');
});

const readme = `# Sample Supplier Itineraries (Test Fixtures)

This folder contains 20 diverse, realistic supplier itineraries collected for Phase 0 pre-build validation and Phase 2 LLM extraction pipeline automated test scoring.

## Test Coverage Inventory

| # | File | Duration | Category | Format Type | Price Basis |
|---|---|---|---|---|---|
| 01 | \`01_kashmir_6n7d_paradise_supplier.txt\` | 6N/7D | Domestic Luxury | Standard B2B quotation | Fixed couple rate (INR) |
| 02 | \`02_goa_3n4d_beach_supplier.txt\` | 3N/4D | Domestic Leisure | Bullet list | Total couple net |
| 03 | \`03_kerala_5n6d_backwaters_supplier.txt\` | 5N/6D | Domestic Scenic | Detailed daywise | Couple net rate |
| 04 | \`04_bali_6n7d_dmc_quote.txt\` | 6N/7D | International Island | DMC formal quote | USD per person |
| 05 | \`05_dubai_4n5d_dmc_quote.txt\` | 4N/5D | International City | Tiered multi-hotel (3* & 4*) | AED per person |
| 06 | \`06_rajasthan_7n8d_heritage_supplier.txt\` | 7N/8D | Domestic Cultural | Multi-city circuit | Total couple net |
| 07 | \`07_himachal_5n6d_shimla_manali.txt\` | 5N/6D | Domestic Hill Station | Volvo + private cab hybrid | Total package |
| 08 | \`08_vietnam_8n9d_hanoi_danang_saigon.txt\` | 8N/9D | International Multi-City | Multi-flight regional DMC | USD per person |
| 09 | \`09_thailand_4n5d_phuket_krabi_whatsapp.txt\` | 4N/5D | International Beach | Raw forwarded WhatsApp paste | THB per person |
| 10 | \`10_ladakh_6n7d_bike_suv_supplier.txt\` | 6N/7D | Domestic Adventure | Altitude & permit notes | Per person (4-pax basis) |
| 11 | \`11_andaman_4n5d_portblair_havelock.txt\` | 4N/5D | Domestic Island | Ferry & island transfers | Per person twin share |
| 12 | \`12_singapore_malaysia_6n7d_cruise.txt\` | 6N/7D | International Cruise Combo | Cruise + hotel hybrid | SGD per person |
| 13 | \`13_bhutan_5n6d_paro_thimphu.txt\` | 5N/6D | International Himalayan | Mandatory SDF & guide | Per person (Indian national) |
| 14 | \`14_sikkim_darjeeling_5n6d_northeast.txt\` | 5N/6D | Domestic Hill Station | Permit-dependent sights | Per person twin share |
| 15 | \`15_char_dham_11n12d_pilgrimage.txt\` | 11N/12D | Domestic Pilgrimage | Long duration trekking/heli | Per person group rate |
| 16 | \`16_maldives_3n4d_water_villa.txt\` | 3N/4D | International Luxury | All-inclusive resort quote | USD couple rate |
| 17 | \`17_europe_10n11d_swiss_paris.txt\` | 10N/11D | International Europe | Rail pass & mountain peaks | EUR per person |
| 18 | \`18_sri_lanka_5n6d_ramayana_trail.txt\` | 5N/6D | International Cultural | Chauffeur guide format | USD per person |
| 19 | \`19_meghalaya_4n5d_shillong_cherrapunji.txt\` | 4N/5D | Domestic Trekking | Caving & root bridges | Per person couple rate |
| 20 | \`20_uttarakhand_4n5d_rishikesh_mussoorie_whatsapp.txt\` | 4N/5D | Domestic Adventure | Informal Hindi/English WhatsApp | Total couple net |
`;

fs.writeFileSync(path.join(targetDir, 'README.md'), readme.trim(), 'utf8');
console.log('Successfully generated 20 sample supplier itineraries in sample-itineraries/');
