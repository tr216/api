module.exports=function(conn){
    var schema = mongoose.Schema({
        partyType:{ type: String, trim:true, default: '',enum:['Customer','Vendor','CustomerAgency','VendorAgency']},
        mainParty: {type: mongoose.Schema.Types.ObjectId, ref: 'parties',
        	validate: {
              validator: function(v) {
                if((this.partyType=='CustomerAgeny' || this.partyType=='VendorAgeny') && ( (v || '') == '')){
                    return false;
                }else{
                    return true;
                }
              },
              message: 'Acente eklerken, ana firma secmelisiniz'
            }
        },
        account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts'},
        websiteURI:{value:{ type: String, trim:true, default: ''}},
        partyIdentification:[{
            ID:{ 
                value:{ type: String, trim:true, default: ''},
                attr: {
                    schemeID: { type: String}
                }
            }
        }],
        partyName:{
            name:{value:{ type: String, trim:true, required:[true,'Isim gereklidir'], default: ''}}
        },
        postalAddress:{
            room:{ value:{ type: String, trim:true, default: ''}},
            streetName:{ value:{ type: String, trim:true, default: ''}},
            blockName:{ value:{ type: String, trim:true, default: ''}},
            buildingName:{ value:{ type: String, trim:true, default: ''}},
            buildingNumber:{ value:{ type: String, trim:true, default: ''}},
            citySubdivisionName:{ value:{ type: String, trim:true, default: ''}},
            cityName:{ value:{ type: String, trim:true, default: ''}},
            postalZone:{ value:{ type: String, trim:true, default: ''}},
            postbox:{ value:{ type: String, trim:true, default: ''}},
            region:{ value:{ type: String, trim:true, default: ''}},
            district:{ value:{ type: String, trim:true, default: ''}},
            province:{ value:{ type: String, trim:true, default: ''}},
            country:{
                identificationCode:{ value:{ type: String, trim:true, default: 'TR'}},
                name:{value:{ type: String, trim:true, default: 'Türkiye'}}
            }
        },
        partyTaxScheme:{
            taxScheme:{
                name:{ value:{ type: String, trim:true, default: ''}},
                taxTypeCode:{ value:{ type: String, trim:true, default: ''}}
            }
        },
        contact:{
            telephone:{ value:{ type: String, trim:true, default: ''}},
            telefax:{ value:{ type: String, trim:true, default: ''}},
            electronicMail:{ value:{ type: String, trim:true, default: ''}}
        },
        person:{
            firstName:{ value:{ type: String, trim:true, default: ''}},
            middleName:{ value:{ type: String, trim:true, default: ''}},
            familyName:{ value:{ type: String, trim:true, default: ''}},
            nameSuffix:{ value:{ type: String, trim:true, default: ''}},
            title:{ value:{ type: String, trim:true, default: ''}}
        },
        tags:{ type: String, trim:true, default: ''},
        passive:{type:Boolean , default:false},
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now}
    });

    schema.pre('save', function(next) {
        next();
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'));
    });
    schema.pre('remove', function(next) {
        next();
    });

    schema.pre('remove', true, function(next, done) {
        next();
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'));
    });

    schema.on('init', function(model) {

    });
    

    schema.plugin(mongoosePaginate);
    schema.plugin(mongooseAggregatePaginate);
    
    schema.index({
        "partyName.name.value":1,
        "partyType":1,
        "passive":1,
        "postalAddress.province.value":1,
        "postalAddress.cityName.value":1,
        "person.firstName.value":1,
        "person.middleName.value":1,
        "person.familyName.value":1,
        "createdDate":1,
        "tags":1
    });

    var collectionName='parties';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    return model;
}
