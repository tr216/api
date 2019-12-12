global.mrutil=require('./lib/mrutil.js');


var depNameList=[
' ',
'3D GOZLUK',
'3D GÖZLÜK',
'3-D GÖZLÜK',
'3DGOZ',
'3DGOZLUK',
'3DGOZLÜK',
'BILET',
'BİLET',
'BÜYÜK MENÜ',
'CIFT KISİLİK MENÜ',
'CİFT KİŞİLİK MENÜ',
'ÇİFT KİŞİLİK MENÜ',
'ÇİFTLİ MENÜ',
'GOZLUK',
'GÖZLUK',
'GÖZLÜK',
'GÖZLÜK BEDELİ',
'H,İÇİ TEK KİŞİLİK MENÜ',
'H. İÇİ TEK',
'H.CIFTLI M.',
'H.İ ÇK MENÜ',
'H.İ TEKLI M.',
'H.İ TK MENÜ',
'H.İ. ÇİFTLİ M.',
'H.İ. TEKLİ M.',
'H.İ.ÇİFT KİŞİLİK MENÜ',
'H.İ.TEK KİŞİLİK MENÜ',
'H.İÇİ ÇİFT',
'H.İÇİ ÇİFT MENÜ',
'H.İÇİ ÇİFTLİ M.',
'H.İÇİ TEK MENÜ',
'H.İÇİ.ÇİFT K.MENÜ',
'H.İÇİ.TEK KİŞ.MENÜ',
'H.S ÇK MENÜ',
'H.S TK MENÜ',
'H.S. ÇİFTLİ M.',
'H.S. TEKLİ M.',
'H.S.CIFTLI M.',
'H.S.ÇİFT KİŞİLİK MENÜ',
'H.S.TEK KİŞİLİK MENÜ',
'H.S.TEKLI M.',
'H.SONU ÇİFT',
'H.SONU ÇİFT KŞLK MENÜ',
'H.SONU ÇİFT MENÜ',
'H.SONU TEK',
'H.SONU TEK KİŞİLİK MENÜ',
'H.SONU TEK MENÜ',
'HAFTA İÇİ ÇİFT',
'HAFTA İÇİ TEK',
'HAFTA SONU ÇİFT',
'HAFTA SONU TEK',
'HAFTAICI CIFT MENU',
'HAFTAICI TEK MENU',
'HAFTAİÇİÇİFTKİŞİLİKMENU',
'HAFTAİÇİÇİFTKİŞİLKMENU',
'HAFTAİÇİTEKKİŞİLİKMENU',
'HAFTASONU CIFT MENU',
'HAFTASONU TEK MENU',
'HAFTASONUÇİFTKİŞİLKMENU',
'HAFTASONUTEKKİŞİLİKMENU',
'HALK GUNU',
'HALK GÜNÜ',
'HALK GÜNÜ MENÜ',
'HALKGUNUMENU',
'HALKGÜNÜMENU',
'HIZ.BED.',
'HIZM.BEDELİ',
'HİZMET',
'İCECEK',
'İÇECEK',
'İÇEÇEK',
'KISIM 1',
'KSM1',
'KSM2',
'KSM3',
'KSM4',
'KSM5',
'KSM5OYUN',
'KSM6',
'KSM6OYUN GİDERİ',
'KSM7',
'KÜCÜK MENÜ',
'MEB',
'MEŞRUBAT',
'MISIR',
'MUHTELİF',
'MUŞRUBAT',
'ORTA MENÜ',
'OYUN',
'OYUN GELİRİ',
'OYUN MAK',
'ÖĞRENCİ BİLET',
'TAM BİLET',
'TEK KİŞİLİK MENÜ',
'TEK MENÜ',
'TEKLİ MENÜ',
'TK MENÜ',
'YİYECEK'
]


var departman={
	BILET_TAM:'',
	BILET_OGRENCI:'',
	GOZLUK:'',
	OYUN:'',
	MUHTELIF:'',
	MENU_CIFT:'',
	MENU_TEK:'',
	MENU_HS_CIFT:'',
	MENU_HS_TEK:'',
	MENU_HI_CIFT:'',
	MENU_HI_TEK:'',
	MENU_HALK_GUNU:'',
	MENU_BUYUK:'',
	MENU_ORTA:'',
	MENU_KUCUK:'',
	MISIR:'',
	YIYECEK:'',
	ICECEK:'',
	KISIM1:'',
	KISIM2:'',
	KISIM3:'',
	KISIM4:'',
	KISIM5:'',
	KISIM6:'',
	KISIM7:'',
}


for(var i=0;i<depNameList.length;i++){
	var key=departmanKey(depNameList[i]);
	 if(key==''){
		console.log(depNameList[i] ,depNameList[i].lcaseeng(), key);
	}
	
}
console.log('ok.');

function departmanKey(depName){
	if(depName=='') return '';
	depName=depName.lcaseeng();

	if(depName.indexOf('meb')>-1 || depName.indexOf('ogrenci')>-1){
		return 'BILET';
	}

	if(depName.indexOf('bilet')>-1 || depName.indexOf('hiz')>-1){
		return 'BILET';
	}

	if(depName.indexOf('bat')>-1 || depName.indexOf('icecek')>-1){
		return 'ICECEK';
	}

	if(depName.indexOf('3d')>-1 || depName.indexOf('gozluk')>-1){
		return 'GOZLUK';
	}
	
	if(depName.indexOf('oyun')>-1 ){
		return 'OYUN';
	}

	if(depName.indexOf('muhtelif')>-1 ){
		return 'MUHTELIF';
	}

	if(depName.indexOf('ici')>-1 && depName.indexOf('tek')>-1 ||
		depName.indexOf('h.i')>-1 && depName.indexOf('tek')>-1 ||
		depName.indexOf('h.i')>-1 && depName.indexOf('tk')>-1 && depName.indexOf('menu')>-1 ||
		depName.indexOf('sonu')>-1 && depName.indexOf('tek')>-1 ||
		depName.indexOf('h.s')>-1 && depName.indexOf('tek')>-1 ||
		depName.indexOf('h.s')>-1 && depName.indexOf('tk')>-1 && depName.indexOf('menu')>-1 || 
		depName.indexOf('ici')>-1 && depName.indexOf('cift')>-1 ||
		depName.indexOf('h.i')>-1 && depName.indexOf('cift')>-1 ||
		depName.indexOf('h.')>-1 && depName.indexOf('ciftli')>-1 ||
		depName.indexOf('h.i')>-1 && depName.indexOf('ck')>-1 && depName.indexOf('menu')>-1 ||
		depName.indexOf('sonu')>-1 && depName.indexOf('cift')>-1 ||
		depName.indexOf('h.s')>-1 && depName.indexOf('cift')>-1 ||
		depName.indexOf('h.s')>-1 && depName.indexOf('ck')>-1 && depName.indexOf('menu')>-1 ||
		depName.indexOf('buyuk')>-1 ||
		depName.indexOf('orta')>-1 ||
		depName.indexOf('kucuk')>-1 ||
		depName.indexOf('menu')>-1
		){
		return 'MENU';
	}

	
	//halk gunu menu
	if(depName.indexOf('halk')>-1 && depName.indexOf('menu')>-1 ){
		return 'MENU';
	}

	// halk gunu bilet
	if(depName.indexOf('halk')>-1 && depName.indexOf('menu')<0 ){
		return 'BILET';
	}

	if(depName.indexOf('kisim 1')>-1 || depName.indexOf('ksm1')>-1 ){
		return 'KISIM1';
	}

	if(depName.indexOf('ksm2')>-1) return 'KISIM2';
	if(depName.indexOf('ksm3')>-1) return 'KISIM3';
	if(depName.indexOf('ksm4')>-1) return 'KISIM4';
	if(depName.indexOf('ksm5')>-1) return 'KISIM5';
	if(depName.indexOf('ksm6')>-1) return 'KISIM6';
	if(depName.indexOf('ksm7')>-1) return 'KISIM7';

	if(depName.indexOf('misir')>-1) return 'MISIR';
	if(depName.indexOf('yiyecek')>-1) return 'YIYECEK';

	
	return '';
}

