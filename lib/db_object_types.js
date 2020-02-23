const valueType={value:{ type: String, trim:true, default: ''}}
const numberValueType={value:{ type: Number, default: 0}}
const currencytType={ value:{type:Number, default:0}, attr:{ currencyID:{ type: String, trim:true, default: ''}}}
const quantityType={ value:{type:Number, default:0}, attr:{ unitCode:{ type: String, trim:true, default: ''}}}
const countryType={
    identificationCode:valueType,
    name:valueType
}
const periodType={
    startDate:valueType,
    startTime:valueType,
    endDate:valueType,
    endTime:valueType,
    description:valueType,
    durationMeasure:quantityType
}
const partyIdentificationType={ID:{value:{ type: String, trim:true, default: ''}, attr:{schemeID:{ type: String, trim:true, default: ''}}}}

const partyType={
    websiteURI:valueType,
    partyIdentification:[partyIdentificationType],
    partyName:{name:valueType},
    postalAddress:{
        room:valueType,
        streetName:valueType,
        blockName:valueType,
        buildingName:valueType,
        buildingNumber:valueType,
        citySubdivisionName:valueType,
        cityName:valueType,
        postalZone:valueType,
        postbox:valueType,
        region:valueType,
        district:valueType,
        country:countryType
    },
    partyTaxScheme:{
        taxScheme:{
            name:valueType,
            taxTypeCode:valueType
        }
    },
    contact:{
        telephone:valueType,
        telefax:valueType,
        electronicMail:valueType
    },
    person:{
        firstName:valueType,
        middleName:valueType,
        familyName:valueType,
        nameSuffix:valueType,
        title:valueType
    }
}

const exchangeRateType={ 
    sourceCurrencyCode  :valueType,
    targetCurrencyCode  :{value:{ type: String, trim:true, default: 'TRY'}},
    calculationRate   :{value:{ type: Number, default: 0}},
    date   :{ value:{ type: String, trim:true, default: ''}}
}

const actualPackageType={
    ID:valueType,
    quantity:quantityType,
    packagingTypeCode:valueType
}

const dimensionType={
    attributeId:valueType,
    description:[valueType],
    measure:quantityType,
    minimumMeasure:quantityType,
    maximumMeasure:quantityType
}

const itemPropertyType={
    ID:valueType,
    importanceCode:valueType,
    itemPropertyGroup:[{
        ID:valueType,
        importanceCode:valueType,
        name:valueType
    }],
    name:valueType,
    nameCode:valueType,
    rangeDimension:dimensionType,
    value: valueType,
    valueQuantity: quantityType,
    valueQualifier:[valueType],
    usabilityPeriod:periodType
}

const itemInstanceType={
    additionalItemProperty:[itemPropertyType],
    serialId:valueType,
    lotIdentification:{ 
        lotNumberId: valueType,
        expiryDate: valueType,
        additionalItemProperty:[itemPropertyType]
    },
    manufactureDate:valueType,
    manufactureTime:valueType,
    productTraceId:valueType,
    registrationId:valueType
}
module.exports = Object.freeze({
    valueType:valueType,
    numberValueType:numberValueType,
    currencytType:currencytType,
    quantityType:quantityType,
    countryType:countryType,
    partyIdentificationType:partyIdentificationType,
    partyType:partyType,
    exchangeRateType:exchangeRateType,
    actualPackageType:actualPackageType,
    dimensionType:dimensionType,
    itemPropertyType:itemPropertyType,
    itemInstanceType:itemInstanceType
});
