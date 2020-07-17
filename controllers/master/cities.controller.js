module.exports = (member,req, res, cb)=>{
	var province = req.body.province || req.query.province || req.body.provincename || req.query.provincename || ''
	if (province == '') {
		throw 'Sehir bos olamaz'
	} else {
		var sonuc = []
		cities.forEach((e)=>{
			if(e[1]==province)
				sonuc.push(e[2])
		})
		
		cb(sonuc)
	}

}

var cities = [
	['0', 'Türkiye Dışı', 'Rusya'],
	['0', 'Türkiye Dışı', 'Gürcistan'],
	['0', 'Türkiye Dışı', 'Moldova'],
	['0', 'Türkiye Dışı', 'Bulgaristan'],
	['0', 'Türkiye Dışı', 'Ukrayna'],
	['0', 'Türkiye Dışı', 'Romanya'],
	['0', 'Türkiye Dışı', 'Yunanistan'],
	['0', 'Türkiye Dışı', 'Azerbaycan'],
	['0', 'Türkiye Dışı', 'Diğer'],
	['34', 'İstanbul-Avrupa', 'Arnavutköy'],
	['34', 'İstanbul-Avrupa', 'Avcılar'],
	['34', 'İstanbul-Avrupa', 'Bağcılar'],
	['34', 'İstanbul-Avrupa', 'Bahçelievler'],
	['34', 'İstanbul-Avrupa', 'Bakırköy'],
	['34', 'İstanbul-Avrupa', 'Başakşehir'],
	['34', 'İstanbul-Avrupa', 'Bayrampaşa'],
	['34', 'İstanbul-Avrupa', 'Beşiktaş'],
	['34', 'İstanbul-Avrupa', 'Beylikdüzü'],
	['34', 'İstanbul-Avrupa', 'Beyoğlu'],
	['34', 'İstanbul-Avrupa', 'Büyükçekmece'],
	['34', 'İstanbul-Avrupa', 'Çatalca'],
	['34', 'İstanbul-Avrupa', 'Esenler'],
	['34', 'İstanbul-Avrupa', 'Esenyurt'],
	['34', 'İstanbul-Avrupa', 'Eyüp'],
	['34', 'İstanbul-Avrupa', 'Fatih'],
	['34', 'İstanbul-Avrupa', 'Gaziosmanpaşa'],
	['34', 'İstanbul-Avrupa', 'Güngören'],
	['34', 'İstanbul-Avrupa', 'Kağıthane'],
	['34', 'İstanbul-Avrupa', 'Küçükçekmece'],
	['34', 'İstanbul-Avrupa', 'Sarıyer'],
	['34', 'İstanbul-Avrupa', 'Silivri'],
	['34', 'İstanbul-Avrupa', 'Sultangazi'],
	['34', 'İstanbul-Avrupa', 'Şişli'],
	['34', 'İstanbul-Avrupa', 'Zeytinburnu'],
	['34', 'İstanbul-Anadolu', 'Adalar'],
	['34', 'İstanbul-Anadolu', 'Ataşehir'],
	['34', 'İstanbul-Anadolu', 'Beykoz'],
	['34', 'İstanbul-Anadolu', 'Çekmeköy'],
	['34', 'İstanbul-Anadolu', 'Kadıköy'],
	['34', 'İstanbul-Anadolu', 'Kartal'],
	['34', 'İstanbul-Anadolu', 'Maltepe'],
	['34', 'İstanbul-Anadolu', 'Pendik'],
	['34', 'İstanbul-Anadolu', 'Sancaktepe'],
	['34', 'İstanbul-Anadolu', 'Sultanbeyli'],
	['34', 'İstanbul-Anadolu', 'Şile'],
	['34', 'İstanbul-Anadolu', 'Tuzla'],
	['34', 'İstanbul-Anadolu', 'Ümraniye'],
	['34', 'İstanbul-Anadolu', 'Üsküdar'],
	['1', 'Adana', 'Seyhan'],
	['1', 'Adana', 'Yüreğir'],
	['1', 'Adana', 'Sarıçam'],
	['1', 'Adana', 'Çukurova'],
	['1', 'Adana', 'Aladağ(Karsantı)'],
	['1', 'Adana', 'Ceyhan'],
	['1', 'Adana', 'Feke'],
	['1', 'Adana', 'İmamoğlu'],
	['1', 'Adana', 'Karaisalı'],
	['1', 'Adana', 'Karataş'],
	['1', 'Adana', 'Kozan'],
	['1', 'Adana', 'Pozantı'],
	['1', 'Adana', 'Saimbeyli'],
	['1', 'Adana', 'Tufanbeyli'],
	['1', 'Adana', 'Yumurtalık'],
	['2', 'Adıyaman', 'Adıyaman Merkez'],
	['2', 'Adıyaman', 'Besni'],
	['2', 'Adıyaman', 'Çelikhan'],
	['2', 'Adıyaman', 'Gerger'],
	['2', 'Adıyaman', 'Gölbaşı'],
	['2', 'Adıyaman', 'Kahta'],
	['2', 'Adıyaman', 'Samsat'],
	['2', 'Adıyaman', 'Sincik'],
	['2', 'Adıyaman', 'Tut'],
	['3', 'Afyonkarahisar', 'Afyonkarahisar Merkez'],
	['3', 'Afyonkarahisar', 'Başmakçı'],
	['3', 'Afyonkarahisar', 'Bayat'],
	['3', 'Afyonkarahisar', 'Bolvadin'],
	['3', 'Afyonkarahisar', 'Çay'],
	['3', 'Afyonkarahisar', 'Çobanlar'],
	['3', 'Afyonkarahisar', 'Dazkırı'],
	['3', 'Afyonkarahisar', 'Dinar'],
	['3', 'Afyonkarahisar', 'Emirdağ'],
	['3', 'Afyonkarahisar', 'Evciler'],
	['3', 'Afyonkarahisar', 'Hocalar'],
	['3', 'Afyonkarahisar', 'İhsaniye'],
	['3', 'Afyonkarahisar', 'İscehisar'],
	['3', 'Afyonkarahisar', 'Kızılören'],
	['3', 'Afyonkarahisar', 'Sandıklı'],
	['3', 'Afyonkarahisar', 'Sincanlı(Sinanpaşa)'],
	['3', 'Afyonkarahisar', 'Sultandağı'],
	['3', 'Afyonkarahisar', 'Şuhut'],
	['4', 'Ağrı', 'Ağrı Merkez'],
	['4', 'Ağrı', 'Diyadin'],
	['4', 'Ağrı', 'Doğubeyazıt'],
	['4', 'Ağrı', 'Eleşkirt'],
	['4', 'Ağrı', 'Hamur'],
	['4', 'Ağrı', 'Patnos'],
	['4', 'Ağrı', 'Taşlıçay'],
	['4', 'Ağrı', 'Tutak'],
	['5', 'Amasya', 'Amasya Merkez'],
	['5', 'Amasya', 'Göynücek'],
	['5', 'Amasya', 'Gümüşhacıköy'],
	['5', 'Amasya', 'Hamamözü'],
	['5', 'Amasya', 'Merzifon'],
	['5', 'Amasya', 'Suluova'],
	['5', 'Amasya', 'Taşova'],
	['6', 'Ankara', 'Altındağ'],
	['6', 'Ankara', 'Çankaya'],
	['6', 'Ankara', 'Etimesgut'],
	['6', 'Ankara', 'Keçiören'],
	['6', 'Ankara', 'Mamak'],
	['6', 'Ankara', 'Sincan'],
	['6', 'Ankara', 'Yenimahalle'],
	['6', 'Ankara', 'Gölbaşı'],
	['6', 'Ankara', 'Pursaklar'],
	['6', 'Ankara', 'Akyurt'],
	['6', 'Ankara', 'Ayaş'],
	['6', 'Ankara', 'Bala'],
	['6', 'Ankara', 'Beypazarı'],
	['6', 'Ankara', 'Çamlıdere'],
	['6', 'Ankara', 'Çubuk'],
	['6', 'Ankara', 'Elmadağ'],
	['6', 'Ankara', 'Evren'],
	['6', 'Ankara', 'Güdül'],
	['6', 'Ankara', 'Haymana'],
	['6', 'Ankara', 'Kalecik'],
	['6', 'Ankara', 'Kazan'],
	['6', 'Ankara', 'Kızılcahamam'],
	['6', 'Ankara', 'Nallıhan'],
	['6', 'Ankara', 'Polatlı'],
	['6', 'Ankara', 'Şereflikoçhisar'],
	['7', 'Antalya', 'Muratpaşa'],
	['7', 'Antalya', 'Kepez'],
	['7', 'Antalya', 'Konyaaltı'],
	['7', 'Antalya', 'Aksu'],
	['7', 'Antalya', 'Döşemealtı'],
	['7', 'Antalya', 'Akseki'],
	['7', 'Antalya', 'Alanya'],
	['7', 'Antalya', 'Elmalı'],
	['7', 'Antalya', 'Finike'],
	['7', 'Antalya', 'Gazipaşa'],
	['7', 'Antalya', 'Gündoğmuş'],
	['7', 'Antalya', 'İbradı(Aydınkent)'],
	['7', 'Antalya', 'Kale(Demre)'],
	['7', 'Antalya', 'Kaş'],
	['7', 'Antalya', 'Kemer'],
	['7', 'Antalya', 'Korkuteli'],
	['7', 'Antalya', 'Kumluca'],
	['7', 'Antalya', 'Manavgat'],
	['7', 'Antalya', 'Serik'],
	['8', 'Artvin', 'Artvin Merkez'],
	['8', 'Artvin', 'Ardanuç'],
	['8', 'Artvin', 'Arhavi'],
	['8', 'Artvin', 'Borçka'],
	['8', 'Artvin', 'Hopa'],
	['8', 'Artvin', 'Murgul(Göktaş)'],
	['8', 'Artvin', 'Şavşat'],
	['8', 'Artvin', 'Yusufeli'],
	['9', 'Aydın', 'Aydın Merkez'],
	['9', 'Aydın', 'Bozdoğan'],
	['9', 'Aydın', 'Buharkent(Çubukdağı)'],
	['9', 'Aydın', 'Çine'],
	['9', 'Aydın', 'Germencik'],
	['9', 'Aydın', 'İncirliova'],
	['9', 'Aydın', 'Karacasu'],
	['9', 'Aydın', 'Karpuzlu'],
	['9', 'Aydın', 'Koçarlı'],
	['9', 'Aydın', 'Köşk'],
	['9', 'Aydın', 'Kuşadası'],
	['9', 'Aydın', 'Kuyucak'],
	['9', 'Aydın', 'Nazilli'],
	['9', 'Aydın', 'Söke'],
	['9', 'Aydın', 'Sultanhisar'],
	['9', 'Aydın', 'Didim(Yenihisar)'],
	['9', 'Aydın', 'Yenipazar'],
	['10', 'Balıkesir', 'Balıkesir Merkez'],
	['10', 'Balıkesir', 'Ayvalık'],
	['10', 'Balıkesir', 'Balya'],
	['10', 'Balıkesir', 'Bandırma'],
	['10', 'Balıkesir', 'Bigadiç'],
	['10', 'Balıkesir', 'Burhaniye'],
	['10', 'Balıkesir', 'Dursunbey'],
	['10', 'Balıkesir', 'Edremit'],
	['10', 'Balıkesir', 'Erdek'],
	['10', 'Balıkesir', 'Gömeç'],
	['10', 'Balıkesir', 'Gönen'],
	['10', 'Balıkesir', 'Havran'],
	['10', 'Balıkesir', 'İvrindi'],
	['10', 'Balıkesir', 'Kepsut'],
	['10', 'Balıkesir', 'Manyas'],
	['10', 'Balıkesir', 'Marmara'],
	['10', 'Balıkesir', 'Savaştepe'],
	['10', 'Balıkesir', 'Sındırgı'],
	['10', 'Balıkesir', 'Susurluk'],
	['11', 'Bilecik', 'Bilecik Merkez'],
	['11', 'Bilecik', 'Bozüyük'],
	['11', 'Bilecik', 'Gölpazarı'],
	['11', 'Bilecik', 'İnhisar'],
	['11', 'Bilecik', 'Osmaneli'],
	['11', 'Bilecik', 'Pazaryeri'],
	['11', 'Bilecik', 'Söğüt'],
	['11', 'Bilecik', 'Yenipazar'],
	['12', 'Bingöl', 'Bingöl Merkez'],
	['12', 'Bingöl', 'Adaklı'],
	['12', 'Bingöl', 'Genç'],
	['12', 'Bingöl', 'Karlıova'],
	['12', 'Bingöl', 'Kığı'],
	['12', 'Bingöl', 'Solhan'],
	['12', 'Bingöl', 'Yayladere'],
	['12', 'Bingöl', 'Yedisu'],
	['13', 'Bitlis', 'Bitlis Merkez'],
	['13', 'Bitlis', 'Adilcevaz'],
	['13', 'Bitlis', 'Ahlat'],
	['13', 'Bitlis', 'Güroymak'],
	['13', 'Bitlis', 'Hizan'],
	['13', 'Bitlis', 'Mutki'],
	['13', 'Bitlis', 'Tatvan'],
	['14', 'Bolu', 'Bolu Merkez'],
	['14', 'Bolu', 'Dörtdivan'],
	['14', 'Bolu', 'Gerede'],
	['14', 'Bolu', 'Göynük'],
	['14', 'Bolu', 'Kıbrıscık'],
	['14', 'Bolu', 'Mengen'],
	['14', 'Bolu', 'Mudurnu'],
	['14', 'Bolu', 'Seben'],
	['14', 'Bolu', 'Yeniçağa'],
	['15', 'Burdur', 'Burdur Merkez'],
	['15', 'Burdur', 'Ağlasun'],
	['15', 'Burdur', 'Altınyayla(Dirmil)'],
	['15', 'Burdur', 'Bucak'],
	['15', 'Burdur', 'Çavdır'],
	['15', 'Burdur', 'Çeltikçi'],
	['15', 'Burdur', 'Gölhisar'],
	['15', 'Burdur', 'Karamanlı'],
	['15', 'Burdur', 'Kemer'],
	['15', 'Burdur', 'Tefenni'],
	['15', 'Burdur', 'Yeşilova'],
	['16', 'Bursa', 'Nilüfer'],
	['16', 'Bursa', 'Osmangazi'],
	['16', 'Bursa', 'Yıldırım'],
	['16', 'Bursa', 'Büyükorhan'],
	['16', 'Bursa', 'Gemlik'],
	['16', 'Bursa', 'Gürsu'],
	['16', 'Bursa', 'Harmancık'],
	['16', 'Bursa', 'İnegöl'],
	['16', 'Bursa', 'İznik'],
	['16', 'Bursa', 'Karacabey'],
	['16', 'Bursa', 'Keles'],
	['16', 'Bursa', 'Kestel'],
	['16', 'Bursa', 'Mudanya'],
	['16', 'Bursa', 'Mustafakemalpaşa'],
	['16', 'Bursa', 'Orhaneli'],
	['16', 'Bursa', 'Orhangazi'],
	['16', 'Bursa', 'Yenişehir'],
	['17', 'Çanakkale', 'Çanakkale Merkez'],
	['17', 'Çanakkale', 'Ayvacık'],
	['17', 'Çanakkale', 'Bayramiç'],
	['17', 'Çanakkale', 'Biga'],
	['17', 'Çanakkale', 'Bozcaada'],
	['17', 'Çanakkale', 'Çan'],
	['17', 'Çanakkale', 'Eceabat'],
	['17', 'Çanakkale', 'Ezine'],
	['17', 'Çanakkale', 'Gelibolu'],
	['17', 'Çanakkale', 'Gökçeada(İmroz)'],
	['17', 'Çanakkale', 'Lapseki'],
	['17', 'Çanakkale', 'Yenice'],
	['18', 'Çankırı', 'Çankırı Merkez'],
	['18', 'Çankırı', 'Atkaracalar'],
	['18', 'Çankırı', 'Bayramören'],
	['18', 'Çankırı', 'Çerkeş'],
	['18', 'Çankırı', 'Eldivan'],
	['18', 'Çankırı', 'Ilgaz'],
	['18', 'Çankırı', 'Kızılırmak'],
	['18', 'Çankırı', 'Korgun'],
	['18', 'Çankırı', 'Kurşunlu'],
	['18', 'Çankırı', 'Orta'],
	['18', 'Çankırı', 'Şabanözü'],
	['18', 'Çankırı', 'Yapraklı'],
	['19', 'Çorum', 'Çorum Merkez'],
	['19', 'Çorum', 'Alaca'],
	['19', 'Çorum', 'Bayat'],
	['19', 'Çorum', 'Boğazkale'],
	['19', 'Çorum', 'Dodurga'],
	['19', 'Çorum', 'İskilip'],
	['19', 'Çorum', 'Kargı'],
	['19', 'Çorum', 'Laçin'],
	['19', 'Çorum', 'Mecitözü'],
	['19', 'Çorum', 'Oğuzlar(Karaören)'],
	['19', 'Çorum', 'Ortaköy'],
	['19', 'Çorum', 'Osmancık'],
	['19', 'Çorum', 'Sungurlu'],
	['19', 'Çorum', 'Uğurludağ'],
	['20', 'Denizli', 'Denizli Merkez'],
	['20', 'Denizli', 'Acıpayam'],
	['20', 'Denizli', 'Akköy'],
	['20', 'Denizli', 'Babadağ'],
	['20', 'Denizli', 'Baklan'],
	['20', 'Denizli', 'Bekilli'],
	['20', 'Denizli', 'Beyağaç'],
	['20', 'Denizli', 'Bozkurt'],
	['20', 'Denizli', 'Buldan'],
	['20', 'Denizli', 'Çal'],
	['20', 'Denizli', 'Çameli'],
	['20', 'Denizli', 'Çardak'],
	['20', 'Denizli', 'Çivril'],
	['20', 'Denizli', 'Güney'],
	['20', 'Denizli', 'Honaz'],
	['20', 'Denizli', 'Kale'],
	['20', 'Denizli', 'Sarayköy'],
	['20', 'Denizli', 'Serinhisar'],
	['20', 'Denizli', 'Tavas'],
	['21', 'Diyarbakır', 'Sur'],
	['21', 'Diyarbakır', 'Bağlar'],
	['21', 'Diyarbakır', 'Yenişehir'],
	['21', 'Diyarbakır', 'Kayapınar'],
	['21', 'Diyarbakır', 'Bismil'],
	['21', 'Diyarbakır', 'Çermik'],
	['21', 'Diyarbakır', 'Çınar'],
	['21', 'Diyarbakır', 'Çüngüş'],
	['21', 'Diyarbakır', 'Dicle'],
	['21', 'Diyarbakır', 'Eğil'],
	['21', 'Diyarbakır', 'Ergani'],
	['21', 'Diyarbakır', 'Hani'],
	['21', 'Diyarbakır', 'Hazro'],
	['21', 'Diyarbakır', 'Kocaköy'],
	['21', 'Diyarbakır', 'Kulp'],
	['21', 'Diyarbakır', 'Lice'],
	['21', 'Diyarbakır', 'Silvan'],
	['22', 'Edirne', 'Edirne Merkez'],
	['22', 'Edirne', 'Enez'],
	['22', 'Edirne', 'Havsa'],
	['22', 'Edirne', 'İpsala'],
	['22', 'Edirne', 'Keşan'],
	['22', 'Edirne', 'Lalapaşa'],
	['22', 'Edirne', 'Meriç'],
	['22', 'Edirne', 'Süleoğlu(Süloğlu)'],
	['22', 'Edirne', 'Uzunköprü'],
	['23', 'Elazığ', 'Elazığ Merkez'],
	['23', 'Elazığ', 'Ağın'],
	['23', 'Elazığ', 'Alacakaya'],
	['23', 'Elazığ', 'Arıcak'],
	['23', 'Elazığ', 'Baskil'],
	['23', 'Elazığ', 'Karakoçan'],
	['23', 'Elazığ', 'Keban'],
	['23', 'Elazığ', 'Kovancılar'],
	['23', 'Elazığ', 'Maden'],
	['23', 'Elazığ', 'Palu'],
	['23', 'Elazığ', 'Sivrice'],
	['24', 'Erzincan', 'Erzincan Merkez'],
	['24', 'Erzincan', 'Çayırlı'],
	['24', 'Erzincan', 'İliç(Ilıç)'],
	['24', 'Erzincan', 'Kemah'],
	['24', 'Erzincan', 'Kemaliye'],
	['24', 'Erzincan', 'Otlukbeli'],
	['24', 'Erzincan', 'Refahiye'],
	['24', 'Erzincan', 'Tercan'],
	['24', 'Erzincan', 'Üzümlü'],
	['25', 'Erzurum', 'Palandöken'],
	['25', 'Erzurum', 'Yakutiye'],
	['25', 'Erzurum', 'Aziziye(Ilıca)'],
	['25', 'Erzurum', 'Aşkale'],
	['25', 'Erzurum', 'Çat'],
	['25', 'Erzurum', 'Hınıs'],
	['25', 'Erzurum', 'Horasan'],
	['25', 'Erzurum', 'İspir'],
	['25', 'Erzurum', 'Karaçoban'],
	['25', 'Erzurum', 'Karayazı'],
	['25', 'Erzurum', 'Köprüköy'],
	['25', 'Erzurum', 'Narman'],
	['25', 'Erzurum', 'Oltu'],
	['25', 'Erzurum', 'Olur'],
	['25', 'Erzurum', 'Pasinler'],
	['25', 'Erzurum', 'Pazaryolu'],
	['25', 'Erzurum', 'Şenkaya'],
	['25', 'Erzurum', 'Tekman'],
	['25', 'Erzurum', 'Tortum'],
	['25', 'Erzurum', 'Uzundere'],
	['26', 'Eskişehir', 'Odunpazarı'],
	['26', 'Eskişehir', 'Tepebaşı'],
	['26', 'Eskişehir', 'Alpu'],
	['26', 'Eskişehir', 'Beylikova'],
	['26', 'Eskişehir', 'Çifteler'],
	['26', 'Eskişehir', 'Günyüzü'],
	['26', 'Eskişehir', 'Han'],
	['26', 'Eskişehir', 'İnönü'],
	['26', 'Eskişehir', 'Mahmudiye'],
	['26', 'Eskişehir', 'Mihalgazi'],
	['26', 'Eskişehir', 'Mihalıçcık'],
	['26', 'Eskişehir', 'Sarıcakaya'],
	['26', 'Eskişehir', 'Seyitgazi'],
	['26', 'Eskişehir', 'Sivrihisar'],
	['27', 'Gaziantep', 'Şahinbey'],
	['27', 'Gaziantep', 'Şehitkamil'],
	['27', 'Gaziantep', 'Oğuzeli'],
	['27', 'Gaziantep', 'Araban'],
	['27', 'Gaziantep', 'İslahiye'],
	['27', 'Gaziantep', 'Karkamış'],
	['27', 'Gaziantep', 'Nizip'],
	['27', 'Gaziantep', 'Nurdağı'],
	['27', 'Gaziantep', 'Yavuzeli'],
	['28', 'Giresun', 'Giresun Merkez'],
	['28', 'Giresun', 'Alucra'],
	['28', 'Giresun', 'Bulancak'],
	['28', 'Giresun', 'Çamoluk'],
	['28', 'Giresun', 'Çanakçı'],
	['28', 'Giresun', 'Dereli'],
	['28', 'Giresun', 'Doğankent'],
	['28', 'Giresun', 'Espiye'],
	['28', 'Giresun', 'Eynesil'],
	['28', 'Giresun', 'Görele'],
	['28', 'Giresun', 'Güce'],
	['28', 'Giresun', 'Keşap'],
	['28', 'Giresun', 'Piraziz'],
	['28', 'Giresun', 'Şebinkarahisar'],
	['28', 'Giresun', 'Tirebolu'],
	['28', 'Giresun', 'Yağlıdere'],
	['29', 'Gümüşhane', 'Gümüşhane Merkez'],
	['29', 'Gümüşhane', 'Kelkit'],
	['29', 'Gümüşhane', 'Köse'],
	['29', 'Gümüşhane', 'Kürtün'],
	['29', 'Gümüşhane', 'Şiran'],
	['29', 'Gümüşhane', 'Torul'],
	['30', 'Hakkari', 'Hakkari Merkez'],
	['30', 'Hakkari', 'Çukurca'],
	['30', 'Hakkari', 'Şemdinli'],
	['30', 'Hakkari', 'Yüksekova'],
	['31', 'Hatay', 'Antakya'],
	['31', 'Hatay', 'Altınözü'],
	['31', 'Hatay', 'Belen'],
	['31', 'Hatay', 'Dörtyol'],
	['31', 'Hatay', 'Erzin'],
	['31', 'Hatay', 'Hassa'],
	['31', 'Hatay', 'İskenderun'],
	['31', 'Hatay', 'Kırıkhan'],
	['31', 'Hatay', 'Kumlu'],
	['31', 'Hatay', 'Reyhanlı'],
	['31', 'Hatay', 'Samandağ'],
	['31', 'Hatay', 'Yayladağı'],
	['32', 'Isparta', 'Isparta Merkez'],
	['32', 'Isparta', 'Aksu'],
	['32', 'Isparta', 'Atabey'],
	['32', 'Isparta', 'Eğridir(Eğirdir)'],
	['32', 'Isparta', 'Gelendost'],
	['32', 'Isparta', 'Gönen'],
	['32', 'Isparta', 'Keçiborlu'],
	['32', 'Isparta', 'Senirkent'],
	['32', 'Isparta', 'Sütçüler'],
	['32', 'Isparta', 'Şarkikaraağaç'],
	['32', 'Isparta', 'Uluborlu'],
	['32', 'Isparta', 'Yalvaç'],
	['32', 'Isparta', 'Yenişarbademli'],
	['33', 'Mersin', 'Akdeniz'],
	['33', 'Mersin', 'Yenişehir'],
	['33', 'Mersin', 'Toroslar'],
	['33', 'Mersin', 'Mezitli'],
	['33', 'Mersin', 'Anamur'],
	['33', 'Mersin', 'Aydıncık'],
	['33', 'Mersin', 'Bozyazı'],
	['33', 'Mersin', 'Çamlıyayla'],
	['33', 'Mersin', 'Erdemli'],
	['33', 'Mersin', 'Gülnar(Gülpınar)'],
	['33', 'Mersin', 'Mut'],
	['33', 'Mersin', 'Silifke'],
	['33', 'Mersin', 'Tarsus'],
	['35', 'İzmir', 'Aliağa'],
	['35', 'İzmir', 'Balçova'],
	['35', 'İzmir', 'Bayındır'],
	['35', 'İzmir', 'Bornova'],
	['35', 'İzmir', 'Buca'],
	['35', 'İzmir', 'Çiğli'],
	['35', 'İzmir', 'Foça'],
	['35', 'İzmir', 'Gaziemir'],
	['35', 'İzmir', 'Güzelbahçe'],
	['35', 'İzmir', 'Karşıyaka'],
	['35', 'İzmir', 'Kemalpaşa'],
	['35', 'İzmir', 'Konak'],
	['35', 'İzmir', 'Cumaovası(Menderes)'],
	['35', 'İzmir', 'Menemen'],
	['35', 'İzmir', 'Narlıdere'],
	['35', 'İzmir', 'Seferihisar'],
	['35', 'İzmir', 'Selçuk'],
	['35', 'İzmir', 'Torbalı'],
	['35', 'İzmir', 'Urla'],
	['35', 'İzmir', 'Bayraklı'],
	['35', 'İzmir', 'Karabağlar'],
	['35', 'İzmir', 'Bergama'],
	['35', 'İzmir', 'Beydağ'],
	['35', 'İzmir', 'Çeşme'],
	['35', 'İzmir', 'Dikili'],
	['35', 'İzmir', 'Karaburun'],
	['35', 'İzmir', 'Kınık'],
	['35', 'İzmir', 'Kiraz'],
	['35', 'İzmir', 'Ödemiş'],
	['35', 'İzmir', 'Tire'],
	['36', 'Kars', 'Kars Merkez'],
	['36', 'Kars', 'Akyaka'],
	['36', 'Kars', 'Arpaçay'],
	['36', 'Kars', 'Digor'],
	['36', 'Kars', 'Kağızman'],
	['36', 'Kars', 'Sarıkamış'],
	['36', 'Kars', 'Selim'],
	['36', 'Kars', 'Susuz'],
	['37', 'Kastamonu', 'Kastamonu Merkez'],
	['37', 'Kastamonu', 'Abana'],
	['37', 'Kastamonu', 'Ağlı'],
	['37', 'Kastamonu', 'Araç'],
	['37', 'Kastamonu', 'Azdavay'],
	['37', 'Kastamonu', 'Bozkurt'],
	['37', 'Kastamonu', 'Cide'],
	['37', 'Kastamonu', 'Çatalzeytin'],
	['37', 'Kastamonu', 'Daday'],
	['37', 'Kastamonu', 'Devrekani'],
	['37', 'Kastamonu', 'Doğanyurt'],
	['37', 'Kastamonu', 'Hanönü(Gökçeağaç)'],
	['37', 'Kastamonu', 'İhsangazi'],
	['37', 'Kastamonu', 'İnebolu'],
	['37', 'Kastamonu', 'Küre'],
	['37', 'Kastamonu', 'Pınarbaşı'],
	['37', 'Kastamonu', 'Seydiler'],
	['37', 'Kastamonu', 'Şenpazar'],
	['37', 'Kastamonu', 'Taşköprü'],
	['37', 'Kastamonu', 'Tosya'],
	['38', 'Kayseri', 'Kocasinan'],
	['38', 'Kayseri', 'Melikgazi'],
	['38', 'Kayseri', 'Talas'],
	['38', 'Kayseri', 'Akkışla'],
	['38', 'Kayseri', 'Bünyan'],
	['38', 'Kayseri', 'Develi'],
	['38', 'Kayseri', 'Felahiye'],
	['38', 'Kayseri', 'Hacılar'],
	['38', 'Kayseri', 'İncesu'],
	['38', 'Kayseri', 'Özvatan(Çukur)'],
	['38', 'Kayseri', 'Pınarbaşı'],
	['38', 'Kayseri', 'Sarıoğlan'],
	['38', 'Kayseri', 'Sarız'],
	['38', 'Kayseri', 'Tomarza'],
	['38', 'Kayseri', 'Yahyalı'],
	['38', 'Kayseri', 'Yeşilhisar'],
	['39', 'Kırklareli', 'Kırklareli Merkez'],
	['39', 'Kırklareli', 'Babaeski'],
	['39', 'Kırklareli', 'Demirköy'],
	['39', 'Kırklareli', 'Kofçaz'],
	['39', 'Kırklareli', 'Lüleburgaz'],
	['39', 'Kırklareli', 'Pehlivanköy'],
	['39', 'Kırklareli', 'Pınarhisar'],
	['39', 'Kırklareli', 'Vize'],
	['40', 'Kırşehir', 'Kırşehir Merkez'],
	['40', 'Kırşehir', 'Akçakent'],
	['40', 'Kırşehir', 'Akpınar'],
	['40', 'Kırşehir', 'Boztepe'],
	['40', 'Kırşehir', 'Çiçekdağı'],
	['40', 'Kırşehir', 'Kaman'],
	['40', 'Kırşehir', 'Mucur'],
	['41', 'Kocaeli', 'İzmit'],
	['41', 'Kocaeli', 'Başiskele'],
	['41', 'Kocaeli', 'Çayırova'],
	['41', 'Kocaeli', 'Darıca'],
	['41', 'Kocaeli', 'Dilovası'],
	['41', 'Kocaeli', 'Kartepe'],
	['41', 'Kocaeli', 'Gebze'],
	['41', 'Kocaeli', 'Gölcük'],
	['41', 'Kocaeli', 'Kandıra'],
	['41', 'Kocaeli', 'Karamürsel'],
	['41', 'Kocaeli', 'Tütünçiftlik'],
	['41', 'Kocaeli', 'Derince'],
	['42', 'Konya', 'Karatay'],
	['42', 'Konya', 'Meram'],
	['42', 'Konya', 'Selçuklu'],
	['42', 'Konya', 'Ahırlı'],
	['42', 'Konya', 'Akören'],
	['42', 'Konya', 'Akşehir'],
	['42', 'Konya', 'Altınekin'],
	['42', 'Konya', 'Beyşehir'],
	['42', 'Konya', 'Bozkır'],
	['42', 'Konya', 'Cihanbeyli'],
	['42', 'Konya', 'Çeltik'],
	['42', 'Konya', 'Çumra'],
	['42', 'Konya', 'Derbent'],
	['42', 'Konya', 'Derebucak'],
	['42', 'Konya', 'Doğanhisar'],
	['42', 'Konya', 'Emirgazi'],
	['42', 'Konya', 'Ereğli'],
	['42', 'Konya', 'Güneysınır'],
	['42', 'Konya', 'Hadim'],
	['42', 'Konya', 'Halkapınar'],
	['42', 'Konya', 'Hüyük'],
	['42', 'Konya', 'Ilgın'],
	['42', 'Konya', 'Kadınhanı'],
	['42', 'Konya', 'Karapınar'],
	['42', 'Konya', 'Kulu'],
	['42', 'Konya', 'Sarayönü'],
	['42', 'Konya', 'Seydişehir'],
	['42', 'Konya', 'Taşkent'],
	['42', 'Konya', 'Tuzlukçu'],
	['42', 'Konya', 'Yalıhüyük'],
	['42', 'Konya', 'Yunak'],
	['43', 'Kütahya', 'Kütahya Merkez'],
	['43', 'Kütahya', 'Altıntaş'],
	['43', 'Kütahya', 'Aslanapa'],
	['43', 'Kütahya', 'Çavdarhisar'],
	['43', 'Kütahya', 'Domaniç'],
	['43', 'Kütahya', 'Dumlupınar'],
	['43', 'Kütahya', 'Emet'],
	['43', 'Kütahya', 'Gediz'],
	['43', 'Kütahya', 'Hisarcık'],
	['43', 'Kütahya', 'Pazarlar'],
	['43', 'Kütahya', 'Simav'],
	['43', 'Kütahya', 'Şaphane'],
	['43', 'Kütahya', 'Tavşanlı'],
	['43', 'Kütahya', 'Tunçbilek'],
	['44', 'Malatya', 'Malatya Merkez'],
	['44', 'Malatya', 'Akçadağ'],
	['44', 'Malatya', 'Arapkir'],
	['44', 'Malatya', 'Arguvan'],
	['44', 'Malatya', 'Battalgazi'],
	['44', 'Malatya', 'Darende'],
	['44', 'Malatya', 'Doğanşehir'],
	['44', 'Malatya', 'Doğanyol'],
	['44', 'Malatya', 'Hekimhan'],
	['44', 'Malatya', 'Kale'],
	['44', 'Malatya', 'Kuluncak'],
	['44', 'Malatya', 'Pötürge'],
	['44', 'Malatya', 'Yazıhan'],
	['44', 'Malatya', 'Yeşilyurt'],
	['45', 'Manisa', 'Manisa Merkez'],
	['45', 'Manisa', 'Ahmetli'],
	['45', 'Manisa', 'Akhisar'],
	['45', 'Manisa', 'Alaşehir'],
	['45', 'Manisa', 'Demirci'],
	['45', 'Manisa', 'Gölmarmara'],
	['45', 'Manisa', 'Gördes'],
	['45', 'Manisa', 'Kırkağaç'],
	['45', 'Manisa', 'Köprübaşı'],
	['45', 'Manisa', 'Kula'],
	['45', 'Manisa', 'Salihli'],
	['45', 'Manisa', 'Sarıgöl'],
	['45', 'Manisa', 'Saruhanlı'],
	['45', 'Manisa', 'Selendi'],
	['45', 'Manisa', 'Soma'],
	['45', 'Manisa', 'Turgutlu'],
	['46', 'Kahramanmaraş', 'Kahramanmaraş Merkez'],
	['46', 'Kahramanmaraş', 'Afşin'],
	['46', 'Kahramanmaraş', 'Andırın'],
	['46', 'Kahramanmaraş', 'Çağlayancerit'],
	['46', 'Kahramanmaraş', 'Ekinözü'],
	['46', 'Kahramanmaraş', 'Elbistan'],
	['46', 'Kahramanmaraş', 'Göksun'],
	['46', 'Kahramanmaraş', 'Nurhak'],
	['46', 'Kahramanmaraş', 'Pazarcık'],
	['46', 'Kahramanmaraş', 'Türkoğlu'],
	['47', 'Mardin', 'Mardin Merkez'],
	['47', 'Mardin', 'Dargeçit'],
	['47', 'Mardin', 'Derik'],
	['47', 'Mardin', 'Kızıltepe'],
	['47', 'Mardin', 'Mazıdağı'],
	['47', 'Mardin', 'Midyat(Estel)'],
	['47', 'Mardin', 'Nusaybin'],
	['47', 'Mardin', 'Ömerli'],
	['47', 'Mardin', 'Savur'],
	['47', 'Mardin', 'Yeşilli'],
	['48', 'Muğla', 'Muğla Merkez'],
	['48', 'Muğla', 'Bodrum'],
	['48', 'Muğla', 'Dalaman'],
	['48', 'Muğla', 'Datça'],
	['48', 'Muğla', 'Fethiye'],
	['48', 'Muğla', 'Kavaklıdere'],
	['48', 'Muğla', 'Köyceğiz'],
	['48', 'Muğla', 'Marmaris'],
	['48', 'Muğla', 'Milas'],
	['48', 'Muğla', 'Ortaca'],
	['48', 'Muğla', 'Ula'],
	['48', 'Muğla', 'Yatağan'],
	['49', 'Muş', 'Muş Merkez'],
	['49', 'Muş', 'Bulanık'],
	['49', 'Muş', 'Hasköy'],
	['49', 'Muş', 'Korkut'],
	['49', 'Muş', 'Malazgirt'],
	['49', 'Muş', 'Varto'],
	['50', 'Nevşehir', 'Nevşehir Merkez'],
	['50', 'Nevşehir', 'Acıgöl'],
	['50', 'Nevşehir', 'Avanos'],
	['50', 'Nevşehir', 'Derinkuyu'],
	['50', 'Nevşehir', 'Gülşehir'],
	['50', 'Nevşehir', 'Hacıbektaş'],
	['50', 'Nevşehir', 'Kozaklı'],
	['50', 'Nevşehir', 'Ürgüp'],
	['51', 'Niğde', 'Niğde Merkez'],
	['51', 'Niğde', 'Altunhisar'],
	['51', 'Niğde', 'Bor'],
	['51', 'Niğde', 'Çamardı'],
	['51', 'Niğde', 'Çiftlik(Özyurt)'],
	['51', 'Niğde', 'Ulukışla'],
	['52', 'Ordu', 'Ordu Merkez'],
	['52', 'Ordu', 'Akkuş'],
	['52', 'Ordu', 'Aybastı'],
	['52', 'Ordu', 'Çamaş'],
	['52', 'Ordu', 'Çatalpınar'],
	['52', 'Ordu', 'Çaybaşı'],
	['52', 'Ordu', 'Fatsa'],
	['52', 'Ordu', 'Gölköy'],
	['52', 'Ordu', 'Gülyalı'],
	['52', 'Ordu', 'Gürgentepe'],
	['52', 'Ordu', 'İkizce'],
	['52', 'Ordu', 'Karadüz(Kabadüz)'],
	['52', 'Ordu', 'Kabataş'],
	['52', 'Ordu', 'Korgan'],
	['52', 'Ordu', 'Kumru'],
	['52', 'Ordu', 'Mesudiye'],
	['52', 'Ordu', 'Perşembe'],
	['52', 'Ordu', 'Ulubey'],
	['52', 'Ordu', 'Ünye'],
	['53', 'Rize', 'Rize Merkez'],
	['53', 'Rize', 'Ardeşen'],
	['53', 'Rize', 'Çamlıhemşin'],
	['53', 'Rize', 'Çayeli'],
	['53', 'Rize', 'Derepazarı'],
	['53', 'Rize', 'Fındıklı'],
	['53', 'Rize', 'Güneysu'],
	['53', 'Rize', 'Hemşin'],
	['53', 'Rize', 'İkizdere'],
	['53', 'Rize', 'İyidere'],
	['53', 'Rize', 'Kalkandere'],
	['53', 'Rize', 'Pazar'],
	['54', 'Sakarya', 'Adapazarı'],
	['54', 'Sakarya', 'Hendek'],
	['54', 'Sakarya', 'Arifiye'],
	['54', 'Sakarya', 'Erenler'],
	['54', 'Sakarya', 'Serdivan'],
	['54', 'Sakarya', 'Akyazı'],
	['54', 'Sakarya', 'Ferizli'],
	['54', 'Sakarya', 'Geyve'],
	['54', 'Sakarya', 'Karapürçek'],
	['54', 'Sakarya', 'Karasu'],
	['54', 'Sakarya', 'Kaynarca'],
	['54', 'Sakarya', 'Kocaali'],
	['54', 'Sakarya', 'Pamukova'],
	['54', 'Sakarya', 'Sapanca'],
	['54', 'Sakarya', 'Söğütlü'],
	['54', 'Sakarya', 'Taraklı'],
	['55', 'Samsun', 'Atakum'],
	['55', 'Samsun', 'İlkadım'],
	['55', 'Samsun', 'Canik'],
	['55', 'Samsun', 'Tekkeköy'],
	['55', 'Samsun', 'Alaçam'],
	['55', 'Samsun', 'Asarcık'],
	['55', 'Samsun', 'Ayvacık'],
	['55', 'Samsun', 'Bafra'],
	['55', 'Samsun', 'Çarşamba'],
	['55', 'Samsun', 'Havza'],
	['55', 'Samsun', 'Kavak'],
	['55', 'Samsun', 'Ladik'],
	['55', 'Samsun', '19Mayıs(Ballıca)'],
	['55', 'Samsun', 'Salıpazarı'],
	['55', 'Samsun', 'Terme'],
	['55', 'Samsun', 'Vezirköprü'],
	['55', 'Samsun', 'Yakakent'],
	['56', 'Siirt', 'Siirt Merkez'],
	['56', 'Siirt', 'Baykan'],
	['56', 'Siirt', 'Eruh'],
	['56', 'Siirt', 'Kurtalan'],
	['56', 'Siirt', 'Pervari'],
	['56', 'Siirt', 'Aydınlar'],
	['56', 'Siirt', 'Şirvan'],
	['57', 'Sinop', 'Sinop Merkez'],
	['57', 'Sinop', 'Ayancık'],
	['57', 'Sinop', 'Boyabat'],
	['57', 'Sinop', 'Dikmen'],
	['57', 'Sinop', 'Durağan'],
	['57', 'Sinop', 'Erfelek'],
	['57', 'Sinop', 'Gerze'],
	['57', 'Sinop', 'Saraydüzü'],
	['57', 'Sinop', 'Türkeli'],
	['58', 'Sivas', 'Sivas Merkez'],
	['58', 'Sivas', 'Akıncılar'],
	['58', 'Sivas', 'Altınyayla'],
	['58', 'Sivas', 'Divriği'],
	['58', 'Sivas', 'Doğanşar'],
	['58', 'Sivas', 'Gemerek'],
	['58', 'Sivas', 'Gölova'],
	['58', 'Sivas', 'Gürün'],
	['58', 'Sivas', 'Hafik'],
	['58', 'Sivas', 'İmranlı'],
	['58', 'Sivas', 'Kangal'],
	['58', 'Sivas', 'Koyulhisar'],
	['58', 'Sivas', 'Suşehri'],
	['58', 'Sivas', 'Şarkışla'],
	['58', 'Sivas', 'Ulaş'],
	['58', 'Sivas', 'Yıldızeli'],
	['58', 'Sivas', 'Zara'],
	['59', 'Tekirdağ', 'Tekirdağ Merkez'],
	['59', 'Tekirdağ', 'Çerkezköy'],
	['59', 'Tekirdağ', 'Çorlu'],
	['59', 'Tekirdağ', 'Hayrabolu'],
	['59', 'Tekirdağ', 'Malkara'],
	['59', 'Tekirdağ', 'Marmaraereğlisi'],
	['59', 'Tekirdağ', 'Muratlı'],
	['59', 'Tekirdağ', 'Saray'],
	['59', 'Tekirdağ', 'Şarköy'],
	['60', 'Tokat', 'Tokat Merkez'],
	['60', 'Tokat', 'Almus'],
	['60', 'Tokat', 'Artova'],
	['60', 'Tokat', 'Başçiftlik'],
	['60', 'Tokat', 'Erbaa'],
	['60', 'Tokat', 'Niksar'],
	['60', 'Tokat', 'Pazar'],
	['60', 'Tokat', 'Reşadiye'],
	['60', 'Tokat', 'Sulusaray'],
	['60', 'Tokat', 'Turhal'],
	['60', 'Tokat', 'Yeşilyurt'],
	['60', 'Tokat', 'Zile'],
	['61', 'Trabzon', 'Trabzon Merkez'],
	['61', 'Trabzon', 'Akçaabat'],
	['61', 'Trabzon', 'Araklı'],
	['61', 'Trabzon', 'Arsin'],
	['61', 'Trabzon', 'Beşikdüzü'],
	['61', 'Trabzon', 'Çarşıbaşı'],
	['61', 'Trabzon', 'Çaykara'],
	['61', 'Trabzon', 'Dernekpazarı'],
	['61', 'Trabzon', 'Düzköy'],
	['61', 'Trabzon', 'Hayrat'],
	['61', 'Trabzon', 'Köprübaşı'],
	['61', 'Trabzon', 'Maçka'],
	['61', 'Trabzon', 'Of'],
	['61', 'Trabzon', 'Sürmene'],
	['61', 'Trabzon', 'Şalpazarı'],
	['61', 'Trabzon', 'Tonya'],
	['61', 'Trabzon', 'Vakfıkebir'],
	['61', 'Trabzon', 'Yomra'],
	['62', 'Tunceli', 'Tunceli Merkez'],
	['62', 'Tunceli', 'Çemişgezek'],
	['62', 'Tunceli', 'Hozat'],
	['62', 'Tunceli', 'Mazgirt'],
	['62', 'Tunceli', 'Nazımiye'],
	['62', 'Tunceli', 'Ovacık'],
	['62', 'Tunceli', 'Pertek'],
	['62', 'Tunceli', 'Pülümür'],
	['63', 'Şanlıurfa', 'Şanlıurfa Merkez'],
	['63', 'Şanlıurfa', 'Akçakale'],
	['63', 'Şanlıurfa', 'Birecik'],
	['63', 'Şanlıurfa', 'Bozova'],
	['63', 'Şanlıurfa', 'Ceylanpınar'],
	['63', 'Şanlıurfa', 'Halfeti'],
	['63', 'Şanlıurfa', 'Harran'],
	['63', 'Şanlıurfa', 'Hilvan'],
	['63', 'Şanlıurfa', 'Siverek'],
	['63', 'Şanlıurfa', 'Suruç'],
	['63', 'Şanlıurfa', 'Viranşehir'],
	['64', 'Uşak', 'Uşak Merkez'],
	['64', 'Uşak', 'Banaz'],
	['64', 'Uşak', 'Eşme'],
	['64', 'Uşak', 'Karahallı'],
	['64', 'Uşak', 'Sivaslı'],
	['64', 'Uşak', 'Ulubey'],
	['65', 'Van', 'Van Merkez'],
	['65', 'Van', 'Bahçesaray'],
	['65', 'Van', 'Başkale'],
	['65', 'Van', 'Çaldıran'],
	['65', 'Van', 'Çatak'],
	['65', 'Van', 'Edremit(Gümüşdere)'],
	['65', 'Van', 'Erciş'],
	['65', 'Van', 'Gevaş'],
	['65', 'Van', 'Gürpınar'],
	['65', 'Van', 'Muradiye'],
	['65', 'Van', 'Özalp'],
	['65', 'Van', 'Saray'],
	['66', 'Yozgat', 'Yozgat Merkez'],
	['66', 'Yozgat', 'Akdağmadeni'],
	['66', 'Yozgat', 'Aydıncık'],
	['66', 'Yozgat', 'Boğazlıyan'],
	['66', 'Yozgat', 'Çandır'],
	['66', 'Yozgat', 'Çayıralan'],
	['66', 'Yozgat', 'Çekerek'],
	['66', 'Yozgat', 'Kadışehri'],
	['66', 'Yozgat', 'Saraykent'],
	['66', 'Yozgat', 'Sarıkaya'],
	['66', 'Yozgat', 'Sorgun'],
	['66', 'Yozgat', 'Şefaatli'],
	['66', 'Yozgat', 'Yenifakılı'],
	['66', 'Yozgat', 'Yerköy'],
	['67', 'Zonguldak', 'Zonguldak Merkez'],
	['67', 'Zonguldak', 'Alaplı'],
	['67', 'Zonguldak', 'Çaycuma'],
	['67', 'Zonguldak', 'Devrek'],
	['67', 'Zonguldak', 'Karadenizereğli'],
	['67', 'Zonguldak', 'Gökçebey'],
	['68', 'Aksaray', 'Aksaray Merkez'],
	['68', 'Aksaray', 'Ağaçören'],
	['68', 'Aksaray', 'Eskil'],
	['68', 'Aksaray', 'Gülağaç(Ağaçlı)'],
	['68', 'Aksaray', 'Güzelyurt'],
	['68', 'Aksaray', 'Ortaköy'],
	['68', 'Aksaray', 'Sarıyahşi'],
	['69', 'Bayburt', 'Bayburt Merkez'],
	['69', 'Bayburt', 'Aydıntepe'],
	['69', 'Bayburt', 'Demirözü'],
	['70', 'Karaman', 'Karaman Merkez'],
	['70', 'Karaman', 'Ayrancı'],
	['70', 'Karaman', 'Başyayla'],
	['70', 'Karaman', 'Ermenek'],
	['70', 'Karaman', 'Kazımkarabekir'],
	['70', 'Karaman', 'Sarıveliler'],
	['71', 'Kırıkkale', 'Kırıkkale Merkez'],
	['71', 'Kırıkkale', 'Bahşili'],
	['71', 'Kırıkkale', 'Balışeyh'],
	['71', 'Kırıkkale', 'Çelebi'],
	['71', 'Kırıkkale', 'Delice'],
	['71', 'Kırıkkale', 'Karakeçili'],
	['71', 'Kırıkkale', 'Keskin'],
	['71', 'Kırıkkale', 'Sulakyurt'],
	['71', 'Kırıkkale', 'Yahşihan'],
	['72', 'Batman', 'Batman Merkez'],
	['72', 'Batman', 'Beşiri'],
	['72', 'Batman', 'Gercüş'],
	['72', 'Batman', 'Hasankeyf'],
	['72', 'Batman', 'Kozluk'],
	['72', 'Batman', 'Sason'],
	['73', 'Şırnak', 'Şırnak Merkez'],
	['73', 'Şırnak', 'Beytüşşebap'],
	['73', 'Şırnak', 'Cizre'],
	['73', 'Şırnak', 'Güçlükonak'],
	['73', 'Şırnak', 'İdil'],
	['73', 'Şırnak', 'Silopi'],
	['73', 'Şırnak', 'Uludere'],
	['74', 'Bartın', 'Bartın Merkez'],
	['74', 'Bartın', 'Amasra'],
	['74', 'Bartın', 'Kurucaşile'],
	['74', 'Bartın', 'Ulus'],
	['75', 'Ardahan', 'Ardahan Merkez'],
	['75', 'Ardahan', 'Çıldır'],
	['75', 'Ardahan', 'Damal'],
	['75', 'Ardahan', 'Göle'],
	['75', 'Ardahan', 'Hanak'],
	['75', 'Ardahan', 'Posof'],
	['76', 'Iğdır', 'Iğdır Merkez'],
	['76', 'Iğdır', 'Aralık'],
	['76', 'Iğdır', 'Karakoyunlu'],
	['76', 'Iğdır', 'Tuzluca'],
	['77', 'Yalova', 'Yalova Merkez'],
	['77', 'Yalova', 'Altınova'],
	['77', 'Yalova', 'Armutlu'],
	['77', 'Yalova', 'Çiftlikköy'],
	['77', 'Yalova', 'Çınarcık'],
	['77', 'Yalova', 'Termal'],
	['78', 'Karabük', 'Karabük Merkez'],
	['78', 'Karabük', 'Eflani'],
	['78', 'Karabük', 'Eskipazar'],
	['78', 'Karabük', 'Ovacık'],
	['78', 'Karabük', 'Safranbolu'],
	['78', 'Karabük', 'Yenice'],
	['79', 'Kilis', 'Kilis Merkez'],
	['79', 'Kilis', 'Elbeyli'],
	['79', 'Kilis', 'Musabeyli'],
	['79', 'Kilis', 'Polateli'],
	['80', 'Osmaniye', 'Osmaniye Merkez'],
	['80', 'Osmaniye', 'Bahçe'],
	['80', 'Osmaniye', 'Düziçi'],
	['80', 'Osmaniye', 'Hasanbeyli'],
	['80', 'Osmaniye', 'Kadirli'],
	['80', 'Osmaniye', 'Sumbas'],
	['80', 'Osmaniye', 'Toprakkale'],
	['81', 'Düzce', 'Düzce Merkez'],
	['81', 'Düzce', 'Akçakoca'],
	['81', 'Düzce', 'Cumayeri'],
	['81', 'Düzce', 'Çilimli'],
	['81', 'Düzce', 'Gölyaka'],
	['81', 'Düzce', 'Gümüşova'],
	['81', 'Düzce', 'Kaynaşlı'],
	['81', 'Düzce', 'Yığılca']
]