var documentList=[
	{ localDocumentId:'DN0001',	issueDate:{value:'2020-06-30'},issueTime:{value:'12:01:00'}},
	{ localDocumentId:'DN0007',	issueDate:{value:'2020-06-30'},issueTime:{value:'10:11:00'}},
	{ localDocumentId:'DN0006',	issueDate:{value:'2020-07-01'},issueTime:{value:'10:11:00'}},
	{ localDocumentId:'DN0004',	issueDate:{value:'2020-07-01'},issueTime:{value:'10:11:00'}},
	{ localDocumentId:'DN0001',	issueDate:{value:'2020-06-29'},issueTime:{value:'10:11:00'}}
]

function compare(a,b){
	// tarih kontrol
	if(a.issueDate.value>b.issueDate.value){
		return 1
	}else if(a.issueDate.value<b.issueDate.value){
		return -1
	}else{
		//saat kontrol
		if(a.issueTime.value>b.issueTime.value){
			return 1
		}else if(a.issueTime.value<b.issueTime.value){
			return -1
		}else{
			if(a.localDocumentId>b.localDocumentId){
				return 1
			}else if(a.localDocumentId<b.localDocumentId){
				return -1
			}else{
				return 0
			}
		}
	}
}

documentList.forEach((e)=>{
	console.log(JSON.stringify(e))
})

documentList.sort(compare)
console.log('\nSiralanmis\n-------------------------')
documentList.forEach((e)=>{
	console.log(JSON.stringify(e))
})