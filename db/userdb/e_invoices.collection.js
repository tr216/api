module.exports=function(conn){
    var schema = mongoose.Schema({
        ioType :{ type: Number,default: 0}, // 0 - cikis , 1- giris
        eIntegrator: {type: mongoose.Schema.Types.ObjectId, ref: 'e_integrators', required: true},
        profileId: { 
            value: { type: String,default: '', trim:true, enum:['TEMELFATURA','TICARIFATURA','IHRACAT','YOLCUBERABERFATURA','EARSIVFATURA'], required: true}
        },
        ID: {
            value: { type: String, trim:true, default: '',
                validate: {
                  validator: function(v) {
                    if(this.ioType==0 && v!='' && v.length!=16){
                        return false;
                    }else{
                        return true;
                    }
                  },
                  message: 'Fatura numarasi 16 karakter olmalidir veya bos birakiniz.'
                }
            }
        },
        uuid: {value : { type: String, trim:true, default: ''}},
        issueDate: {value :{ type: String,  required: [true,'Fatura tarihi gereklidir']}},
        issueTime: {value :{ type: String,default: '00:00:00.0000000+03:00'}},
        invoiceTypeCode: {
            value:{ type: String,default: '', trim:true, enum:['SATIS','IADE','TEVKIFAT','ISTISNA','OZELMATRAH','IHRACKAYITLI'],
                validate: {
                  validator: function(v) {
                    if(this.ioType==0 && (this.profileId=='IHRACAT' || this.profileId=='YOLCUBERABERFATURA') && v!='ISTISNA'){
                        return false;
                    }else{
                        return true;
                    }
                  },
                  message: 'Senaryo: IHRACAT veya YOLCUBERABERFATURA oldugunda fatura turu ISTISNA olarak secilmelidir.'
                }
            }
        },
        invoicePeriod: {
            startDate: {value:{ type: String}},
            startTime: {value:{ type: String}},
            endDate: {value:{ type: String}},
            endTime: {value:{ type: String}}
        },
        note:[{ value:{ type: String, trim:true, default: ''}}],
        documentCurrencyCode:{value:{ type: String, trim:true, default: 'TRY'}},
        taxCurrencyCode:{value:{ type: String, trim:true, default: 'TRY'}},
        pricingCurrencyCode:{value:{ type: String, trim:true, default: 'TRY'}},
        paymentCurrencyCode:{value:{ type: String, trim:true, default: 'TRY'}},
        paymentAlternativeCurrencyCode:{value:{ type: String, trim:true, default: 'TRY'}},
        lineCountNumeric:{value:{ type: Number,default: 0}},
        additionalDocumentReference:[{ 
            ID:{value:{ type: String, trim:true, default: ''}},
            issueDate:{value:{ type: String, trim:true, default: ''}},
            documentTypeCode:{value:{ type: String, trim:true, default: 'XSLT'}},
            documentType:{value:{ type: String, trim:true, default: ''}},
            documentDescription:[{value:{ type: String, trim:true, default: ''}}],
            attachment: {
                embeddedDocumentBinaryObject: {
                    value:{ type: String, default: ''},
                    attr: {
                        format: { type: String},
                        mimeCode:{ type: String, trim:true, default: 'application/xml'},
                        encodingCode: { type: String, trim:true, default: 'Base64'},
                        characterSetCode:{ type: String, trim:true, default: 'UTF-8'},
                        filename: { type: String, default:'xslt_sablon.xslt'}
                    }
                }
            },
            validityPeriod: {}
        }],
        orderReference:[{ 
            ID:{value:{ type: String, trim:true, default: ''}},
            issueDate:{value:{ type: String, trim:true, default: ''}}
        }],
        despatchDocumentReference:[{ 
            ID:{value:{ type: String, trim:true, default: ''}},
            issueDate:{value:{ type: String, trim:true, default: ''}}
        }],
        accountingSupplierParty:{
            party:{
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
                    name:{value:{ type: String, trim:true, default: ''}}
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
                }
            }
        },
        accountingCustomerParty:{
            party:{
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
                    name:{value:{ type: String, trim:true, default: ''}}
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
                }
            }
        },
        paymentTerms:{
            amount :{ value:{ type: Number,default: 0}, attr:{ currencyID:{ type: String, default:'' } }},
            note:{value:{ type: String, trim:true, default: ''}},
            paymentDueDate:{value:{ type: String, trim:true, default: ''}},
            penaltyAmount :{ value:{ type: Number,default: 0}, attr:{ currencyID:{ type: String, default:'' } }},
            penaltySurchargePercent :{ value:{ type: Number,default: 0}},
            settlementPeriod:{
                description:{ value:{ type: String, trim:true, default: ''}},
                durationMeasure:{},
                startDate: { type: String },
                startTime: { type: String },
                endDate: { type: String },
                endTime: { type: String }
            }

        },
        paymentMeans:[{
            instructionNote:{value:{ type: String, trim:true, default: ''}},
            paymentMeansCode:{value:{ type: String, trim:true, default: ''}, attr:{ name:{ type: String, default:'' } }},
            paymentChannelCode:{value:{ type: String, trim:true, default: ''}, attr:{ name:{ type: String, default:'' } }},
            paymentDueDate:{value:{ type: String, trim:true, default: ''}},
            payerFinancialAccount:{},
            payeeFinancialAccount:{}
        }],
        taxExchangeRate:{ 
            sourceCurrencyCode  :{ value:{ type: String, trim:true, default: 'TRY'}},
            targetCurrencyCode  :{ value:{ type: String, trim:true, default: 'TRY'}},
            calculationRate   :{value:{ type: Number,default: 0}},
            date   :{ value:{ type: String, trim:true, default: ''}}
        },
        pricingExchangeRate:{ 
            sourceCurrencyCode  :{ value:{ type: String, trim:true, default: 'TRY'}},
            targetCurrencyCode  :{ value:{ type: String, trim:true, default: 'TRY'}},
            calculationRate   :{value:{ type: Number,default: 0}},
            date   :{ value:{ type: String, trim:true, default: ''}}
        },
        paymentExchangeRate:{ 
            sourceCurrencyCode  :{ value:{ type: String, trim:true, default: 'TRY'}},
            targetCurrencyCode  :{ value:{ type: String, trim:true, default: 'TRY'}},
            calculationRate   :{value:{ type: Number,default: 0}},
            date   :{ value:{ type: String, trim:true, default: ''}}
        },
        paymentAlternativeExchangeRate:{ 
            sourceCurrencyCode  :{ value:{ type: String, trim:true, default: 'TRY'}},
            targetCurrencyCode  :{ value:{ type: String, trim:true, default: 'TRY'}},
            calculationRate   :{value:{ type: Number,default: 0}},
            date   :{ value:{ type: String, trim:true, default: ''}}
        },
        taxTotal  : [{
            taxAmount :{
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            taxSubtotal:[{
                taxableAmount:{
                    value:{ type: Number,default: 0},
                    attr:{
                        currencyID:{ type: String, default:'' }
                    }
                },
                taxAmount :{
                    value:{ type: Number,default: 0},
                    attr:{
                        currencyID:{ type: String, default:'' }
                    }
                },
                percent :{value:{ type: Number,default: 0}},
                calculationSequenceNumeric :{value:{ type: Number,default: 0}},
                taxCategory :{
                    name:{ value:{ type: String, trim:true, default: ''}},
                    taxScheme:{
                        ID:{ value:{ type: String, trim:true, default: ''}},
                        name:{ value:{ type: String, trim:true, default: ''}},
                        taxTypeCode:{ value:{ type: String, trim:true, default: ''}}
                    },
                    taxExemptionReason:{ value:{ type: String, trim:true, default: ''}},
                    taxExemptionReasonCode:{ value:{ type: String, trim:true, default: ''}}
                }
            }]
        }],
        withholdingTaxTotal  : [{
            taxAmount :{
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            taxSubtotal:[{
                taxableAmount:{
                    value:{ type: Number,default: 0},
                    attr:{
                        currencyID:{ type: String, default:'' }
                    }
                },
                taxAmount :{
                    value:{ type: Number,default: 0},
                    attr:{
                        currencyID:{ type: String, default:'' }
                    }
                },
                percent :{value:{ type: Number,default: 0}},
                calculationSequenceNumeric :{value:{ type: Number,default: 0}},
                taxCategory :{
                    name:{ value:{ type: String, trim:true, default: ''}},
                    taxScheme:{
                        ID:{ value:{ type: String, trim:true, default: ''}},
                        name:{ value:{ type: String, trim:true, default: ''}},
                        taxTypeCode:{ value:{ type: String, trim:true, default: ''}}
                    },
                    taxExemptionReason:{ value:{ type: String, trim:true, default: ''}},
                    taxExemptionReasonCode:{ value:{ type: String, trim:true, default: ''}}
                }
            }]
        }],
        allowanceCharge:[{
            sequenceNumeric:{value:{ type: Number,default: 0}},
            allowanceChargeReason:{ value:{ type: String, trim:true, default: ''}},
            amount: {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            baseAmount:  {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            chargeIndicator:{value:{ type: Boolean,default: false}},
            multiplierFactorNumeric:{value:{ type: Number,default: 0}},
            perUnitAmount: {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            }
        }],
        legalMonetaryTotal: { 
            lineExtensionAmount  : {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            taxExclusiveAmount  : {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            taxInclusiveAmount   : {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            allowanceTotalAmount   : {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            chargeTotalAmount   : {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            payableRoundingAmount   : {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            payableAmount    : {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            }
        },
        invoiceLine:[{
            ID:{ value:{ type: String, trim:true, default: ''}},
            note:[{ value:{ type: String, trim:true, default: ''}}],
            invoicedQuantity :{
                value:{ type: Number,default: 0},
                attr: {
                    unitCode: { type: String, default:'' }
                }
            },
            price : {
                priceAmount :  {
                value:{ type: Number,default: 0},
                    attr:{
                        currencyID:{ type: String, default:'' }
                    }
                }
            },
            lineExtensionAmount : {
                value:{ type: Number,default: 0},
                attr:{
                    currencyID:{ type: String, default:'' }
                }
            },
            orderLineReference:[{
                lineId:{ value:{ type: String, trim:true, default: ''}},
                lineStatusCode:{ value:{ type: String, trim:true, default: ''}},
                salesOrderLineId:{ value:{ type: String, trim:true, default: ''}},
                uuID:{ value:{ type: String, trim:true, default: ''}},
                orderReference:{
                    ID:{ value:{ type: String, trim:true, default: ''}},
                    documentReference: {}, //qwerty alt nesneler var
                    issueDate:{ value:{ type: String, trim:true, default: ''}},
                    orderTypeCode:{ value:{ type: String, trim:true, default: ''}},
                    salesOrderId:{ value:{ type: String, trim:true, default: ''}}
                }
            }],
            item:{
                additionalItemIdentification:[{ID:{ value:{ type: String, trim:true, default: ''}}}],
                brandName:{ value:{ type: String, trim:true, default: ''}},
                buyersItemIdentification:{ID:{ value:{ type: String, trim:true, default: ''}}},
                commodityClassification:[
                    { 
                        itemClassificationCode:{value:{ type: String, trim:true, default: ''}}
                    }
                ],
                description:{ value:{ type: String, trim:true, default: ''}},
                itemInstance:[{}],
                keyword:{ value:{ type: String, trim:true, default: ''}},
                manufacturersItemIdentification:{ID:{ value:{ type: String, trim:true, default: ''}}},
                modelName:{value:{ type: String, trim:true, default: ''}},
                name:{value:{ type: String, trim:true, default: ''}},
                sellersItemIdentification:{ID:{ value:{ type: String, trim:true, default: ''}}},
                originCountry:{
                    identificationCode:{ value:{ type: String, trim:true, default: ''}},
                    name:{value:{ type: String, trim:true, default: ''}}
                }
            },
            receiptLineReference:[{
                documentReference:{},
                lineId:{ value:{ type: String, trim:true, default: ''}},
                lineStatusCode:{ value:{ type: String, trim:true, default: ''}}
            }],
            allowanceCharge:[{
                sequenceNumeric:{value:{ type: Number,default: 0}},
                allowanceChargeReason:{ value:{ type: String, trim:true, default: ''}},
                amount:  {
                    value:{ type: Number,default: 0},
                    attr:{
                        currencyID:{ type: String, default:'' }
                    }
                },
                baseAmount: {
                    value:{ type: Number,default: 0},
                    attr:{
                        currencyID:{ type: String, default:'' }
                    }
                },
                chargeIndicator:{value:{ type: Boolean,default: false}},
                multiplierFactorNumeric:{value:{ type: Number,default: 0}},
                perUnitAmount:{
                    value:{ type: Number,default: 0},
                    attr:{
                        currencyID:{ type: String, default:'' }
                    }
                },
            }],
            delivery : [{
                actualDeliveryDate:{ value:{ type: String, trim:true, default: ''}},
                actualDeliveryTime:{ value:{ type: String, trim:true, default: ''}},
                alternativeDeliveryLocation:{
                    ID:{ value:{ type: String, trim:true, default: ''}},
                    address:{} //qwerty address
                },
                carrierParty:{}, //qwerty party
                deliveryAddress:{}, //qwerty address
                deliveryParty:{}, //qwerty party
                deliveryTerms:[{
                    amount : {
                        value:{ type: Number,default: 0},
                        attr:{
                            currencyID:{ type: String, default:''}
                        }
                    },
                    ID:{ 
                        value:{ type: String, trim:true, default: ''},
                        attr:{ schemeID :{ type: String, default:'INCOTERMS'}}
                    },
                    specialTerms:{value:{ type: String, trim:true, default: ''}}
                }],
                despatch:{
                    ID:{ value:{ type: String, trim:true, default: ''}},
                    actualDespatchDate:{ value:{ type: String, trim:true, default: ''}},
                    actualDespatchTime:{ value:{ type: String, trim:true, default: ''}},
                    contact:{},//qwerty contact
                    despatchAddress:{},//qwerty address
                    despatchParty:{},//qwerty party
                    estimatedDespatchPeriod:{ 
                        description:{ value:{ type: String, trim:true, default: ''}},
                        durationMeasure:{},
                        startDate: { type: String },
                        startTime: { type: String },
                        endDate: { type: String },
                        endTime: { type: String }
                    },
                    instructions:{ value:{ type: String, trim:true, default: ''}}
                },
                ID:{ value:{ type: String, trim:true, default: ''}},
                latestDeliveryDate:{value:{ type: String}},
                latestDeliveryTime:{value:{ type: String}},
                quantity:{
                    value:{ type: Number,default: 0},
                    attr: {
                        unitCode: { type: String }
                    }
                },
                trackingId : { value:{ type: String, trim:true, default: ''}},
                shipment:{
                    ID:{ value:{ type: String, trim:true, default: ''}},
                    consignment:[{
                        ID:{ value:{ type: String, trim:true, default: ''}},
                        totalInvoiceAmount : {
                            value:{ type: Number,default: 0},
                            attr:{
                                currencyID:{ type: String, default:'' }
                            }
                        }
                    }],
                    declaredCustomsValueAmount : {
                        value:{ type: Number,default: 0},
                        attr:{
                            currencyID:{ type: String, default:'' },
                        }
                    },
                    declaredForCarriageValueAmount : {
                        value:{ type: Number,default: 0},
                        attr:{
                            currencyID:{ type: String, default:'' }
                        }
                    },
                    declaredStatisticsValueAmount : {
                        value:{ type: Number,default: 0},
                        attr:{
                            currencyID:{ type: String, default:'' }
                        }
                    },
                    delivery:{}, //qwerty
                    firstArrivalPortLocation:{
                        ID:{ value:{ type: String, trim:true, default: ''}},
                        address:{}
                    },
                    freeOnBoardValueAmount : {
                        value:{ type: Number,default: 0},
                        attr:{
                            currencyID:{ type: String, default:'' }
                        }
                    },
                    goodsItem:[{
                        requiredCustomsId:{ value:{ type: String, trim:true, default: ''}}
                    }], //qwerty alt nesleneler oldukca fazla
                    grossVolumeMeasure:{
                        unitCode:{type: String},
                        value:{ type: Number,default: 0}
                    },
                    grossWeightMeasure:{
                        unitCode:{type: String},
                        value:{ type: Number,default: 0}
                    },
                    handlingCode:{value:{ type: String, trim:true, default: ''}},
                    handlingInstructions:{value:{ type: String, trim:true, default: ''}},
                    insuranceValueAmount : {
                        value:{ type: Number,default: 0},
                        attr:{
                            currencyID:{ type: String, default:'' }
                        }
                    },
                    lastExitPortLocation:{
                        ID:{ value:{ type: String, trim:true, default: ''}},
                        address:{}
                    },
                    netVolumeMeasure:{
                        value:{ type: Number,default: 0},
                        attr: {
                            unitCode: {type: String}
                        }
                    },
                    netWeightMeasure:{
                        value:{ type: Number,default: 0},
                        attr: {
                            unitCode: {type: String}
                        }
                    },
                    returnAddress:{}, //qwerty address
                    shipmentStage:[{transportModeCode:{value:{ type: String, trim:true, default: ''}}}], //qwerty  detaylar kalin, shipment stage ayri bir cumhuriyet
                    specialInstructions:[{ value:{ type: String, trim:true, default: ''}}],
                    totalGoodsItemQuantity:{
                        value:{ type: Number,default: 0},
                        attr: {
                            unitCode: {type: String}
                        }
                    },
                    totalTransportHandlingUnitQuantity:{
                        value:{ type: Number,default: 0},
                        attr: {
                            unitCode: {type: String}
                        }
                    },
                    transportHandlingUnit:[{
                        actualPackage:[{
                            ID:{ value:{ type: String, trim:true, default: ''}},
                            quantity:{
                                value:{ type: Number,default: 0},
                                attr: {
                                    unitCode: { type: String }
                                }
                            },
                            packagingTypeCode:{value:{ type: String, trim:true, default: ''}}
                        }]
                    }] 
                }
            }],
            despatchLineReference:[{
                documentReference:{},
                lineId:{ value:{ type: String, trim:true, default: ''}},
                lineStatusCode:{ value:{ type: String, trim:true, default: ''}}
            }],
            taxTotal:{
                taxAmount :{
                    value:{ type: Number,default: 0},
                    attr:{
                        currencyID:{ type: String, default:'' }
                    }
                },
                taxSubtotal:[{
                    taxableAmount:{
                        value:{ type: Number,default: 0},
                        attr:{
                            currencyID:{ type: String, default:'' }
                        }
                    },
                    taxAmount :{
                        value:{ type: Number,default: 0},
                        attr:{
                            currencyID:{ type: String, default:'' }
                        }
                    },
                    percent :{value:{ type: Number,default: 0}},
                    calculationSequenceNumeric :{value:{ type: Number,default: 0}},
                    taxCategory :{
                        name:{ value:{ type: String, trim:true, default: ''}},
                        taxScheme:{
                            ID:{ value:{ type: String, trim:true, default: ''}},
                            name:{ value:{ type: String, trim:true, default: ''}},
                            taxTypeCode:{ value:{ type: String, trim:true, default: ''}}
                        },
                        taxExemptionReason:{ value:{ type: String, trim:true, default: ''}},
                        taxExemptionReasonCode:{ value:{ type: String, trim:true, default: ''}}
                    }
                }]
            },
            withholdingTaxTotal:[{
                taxAmount :{
                    value:{ type: Number,default: 0},
                    attr:{
                        currencyID:{ type: String, default:'' }
                    }
                },
                taxSubtotal:[{
                    taxableAmount:{
                        value:{ type: Number,default: 0},
                        attr:{
                            currencyID:{ type: String, default:'' }
                        }
                    },
                    taxAmount :{
                        value:{ type: Number,default: 0},
                        attr:{
                            currencyID:{ type: String, default:'' }
                        }
                    },
                    percent :{value:{ type: Number,default: 0}},
                    calculationSequenceNumeric :{value:{ type: Number,default: 0}},
                    taxCategory :{
                        name:{ value:{ type: String, trim:true, default: ''}},
                        taxScheme:{
                            ID:{ value:{ type: String, trim:true, default: ''}},
                            name:{ value:{ type: String, trim:true, default: ''}},
                            taxTypeCode:{ value:{ type: String, trim:true, default: ''}}
                        },
                        taxExemptionReason:{ value:{ type: String, trim:true, default: ''}},
                        taxExemptionReasonCode:{ value:{ type: String, trim:true, default: ''}}
                    }
                }]
            }],
            subInvoiceLine:[{}] //qwerty  invoice line nin aynisi detaylarda
        }],
        pdf:{type: mongoose.Schema.Types.ObjectId, ref: 'files' , default:null},
        html:{type: mongoose.Schema.Types.ObjectId, ref: 'files' , default:null},
        localDocumentId: {type: String, default: ''},
        invoiceStatus: {type: String, default: 'Draft',enum:['Draft','Pending', 'Processing','SentToGib','Approved','Declined','WaitingForAprovement','Error']},
        invoiceErrors:[{code:'',message:''}],
        localStatus: {type: String, default: '',enum:['','transferring','pending','transferred','error']},
        localErrors:[{code:'',message:''}],
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now}
    });

    

    schema.pre('save', function(next) {
        this.lineCountNumeric.value=this.invoiceLine.length;

       
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
        "ioType":1,
        "ID.value":1,
        "uuid.value":1,
        "eIntegrator":1,
        "profileId.value":1,
        "invoiceTypeCode.value":1,
        "documentCurrencyCode.value":1,
        "localDocumentId":1,
        "invoiceStatus":1,
        "localStatus":1,
        "createdDate":1
    });


    var collectionName='e_invoices';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    return model;
}
