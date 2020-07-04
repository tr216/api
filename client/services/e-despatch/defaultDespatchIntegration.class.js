class DespatchIntegration {
	constructor(){
		this.running=false;
		this.dbModel=dbModel;
	}

    DespatchIntegrationClient(callback) { 
    	console.log('IDespatchIntegration.DespatchIntegrationClient() GetSystemDate:',this.GetSystemDate());
    	this.running=true;
    }
        
    // DespatchIntegrationClient(endpointConfigurationName)  {
    
    // }
        
    // DespatchIntegrationClient(string endpointConfigurationName, string remoteAddress) : 
    //             base(endpointConfigurationName, remoteAddress, callback) { }
    //     }
        
    // DespatchIntegrationClient(endpointConfigurationName, remoteAddress){
    // }
        
    // DespatchIntegrationClient(System.ServiceModel.Channels.Binding binding, System.ServiceModel.EndpointAddress remoteAddress) : 
    //             base(binding, remoteAddress, callback) { }
    //     }

    GetSystemDate() { 
		return (new Date()).yyyymmdd();
    }

    /* string[] despatchesIds */
    CloneDespatches(despatchesIds, callback) { }

    /* InboxDespatchQueryModel query */
    GetInboxDespatchesData(query, callback) { }

    /* string despatchId */
    GetInboxDespatchPdf(despatchId, callback) { }

    /* OutboxDespatchQueryModel query */
    GetOutboxDespatchesData(query, callback) { }

    /* string despatchId */
    GetOutboxDespatchPdf(despatchId, callback) { }

    /* InboxDespatchQueryModel query */
    GetInboxDespatches(query, callback) { }

    /* OutboxDespatchQueryModel query */
    GetOutboxDespatches(query, callback) { }

    /* BinaryRequestData data */
    CompressedSaveAsDraft(data, callback) { }

    /* BinaryRequestData data */
    CompressedSendDespatch(data, callback) { }

    /* DespatchInfo[] despatches */
    SaveAsDraft(despatches, callback) { }

    /* DespatchInfo[] despatches */
    SendDespatch(despatches, callback) { }

    /* string despatchId */
    GetInboxDespatch(despatchId, callback) { }

    /* string despatchId */
    GetOutboxDespatch(despatchId, callback) { }

    /* string[] despatchIds */
    QueryInboxDespatchStatus(despatchIds, callback) { }

    /* string[] despatchIds */
    QueryOutboxDespatchStatus(despatchIds, callback) { }

    /* string[] despatchIds */
    GetInboxDespatchStatusWithLogs(despatchIds, callback) { }

    /* string[] despatchIds */
    GetOutboxDespatchStatusWithLogs(despatchIds, callback) { }

    /* string despatchId */
    GetInboxDespatchView(despatchId, callback) { }

    /* string despatchId */
    GetOutboxDespatchView(despatchId, callback) { }

    /* ReceiptAdviceViewContext receiptAdviceViewContext */
    GetReceiptAdviceView(receiptAdviceViewContext, callback) { }

    /* string[] despatchIds */
    CancelDraft(despatchIds, callback) { }

    /* string[] despatchesId, bool isInbox, bool isArchived */
    ChangeDespatchArchiveStatus(despatchesId, isInbox, isArchived, callback) { }

    /* string vknTckn, string alias */
    IsEDespatchUser(vknTckn, alias, callback) { }

    /* ReceiptAdviceInfo[] receiptAdvices */
    SaveReceiptAdviceAsDraft(receiptAdvices, callback) { }

    /* string[] despatchIds */
    SendDraft(despatchIds, callback) { }

    /* ReceiptAdviceInfo[] receiptAdvices */
    SendReceiptAdvice(receiptAdvices, callback) { }

    /* string[] despatchIds */
    SetDespatchesTaken(despatchIds, callback) { }

    /* string[] despatchIds */
    SetDespatchReceiptAdvicesTaken(despatchIds, callback) { }

    /* string[] receiptAdviceDocumentIds */
    SetReceiptAdvicesTaken(receiptAdviceDocumentIds, callback) { }

    /* InboxDespatchListQueryModel query */
    GetInboxDespatchList(query, callback) { }

    /* InboxReceiptAdviceListQueryModel query */
    GetInboxReceiptAdvicesList(query, callback) { }

    /* InboxReceiptAdviceQueryModel query */
    GetInboxReceiptAdvices(query, callback) { }

    /* OutboxDespatchListQueryModel query */
    GetOutboxDespatchList(query, callback) { }

    /* ReceiptAdviceViewContext receiptAdviceViewContext */
    GetReceiptAdvicePdf(receiptAdviceViewContext, callback) { }

    /* ReceiptAdviceTypeInfo[] receiptAdvices */
    SaveReceiptAdviceUblAsDraft(receiptAdvices, callback) { }

    /* ReceiptAdviceTypeInfo[] receiptAdvices */
    SendReceiptAdviceUbl(receiptAdvices, callback) { }

    /* string[] despatchId */
    QueryReceiptAdviceStatus(despatchId, callback) { }

    /* string[] despatchIds */
    RetrySendDespatches(despatchIds, callback) { }

    /* string format */
    GetSystemDateWithFormat(format, callback) { }

    /* SystemUserFilterContext context */
    FilterEDespatchUsers(context, callback) { }

    /* PagedQueryContext pagination */
    GetEDespatchUsers(pagination, callback) { }
    
    /* string vknTckn */
    GetUserAliasses(vknTckn, callback) { }
}

module.exports={
	DespatchIntegration:DespatchIntegration
}
