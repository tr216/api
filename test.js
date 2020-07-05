try{
	console.log('basladi')
	// throw {code:'deneme',message:'hata yapiyoruz'}
	throw 'deneme error'
}catch(err){
	console.log('typeof err:',typeof err)
	Object.keys(err).forEach((e)=>{
		console.log('e.key:',e)
	})
	console.error(err)
}