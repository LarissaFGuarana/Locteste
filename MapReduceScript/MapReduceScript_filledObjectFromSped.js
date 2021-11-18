/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope Public
 */

/*
yyyy.mm.dd	Developer	Ref/Task	Version			Description
------------------------------------------------------------------------------------------------------------------------------------
2020.09.20  BS        	1613		LocBr20.01		Adjust treatment for inutilization invoice numbers
2020.12.08  BS        	1878		LocBr20.02		Adjusted code in getSpedContributionSetup function
2021.03.22  BS        	2313		LocBr20.03		Adjusted validation for invoices
2021.04.07  BS        	2460		LocBr20.04	   Removed spaces of number field
2021.04.07  BS        	2344		LocBr20.05	   Added filter by BranchInformation to Unused invoices
2021.10.06  LF        	2396		LocBr21.01	   Switch itemfulfillment records to tranfer invoice record
2021.11.17  LF        	4288		LocBr21.01		Adjust new obj  C500 region
*/

define([
   'N/search',
   'N/record',
   'N/runtime',
   './Scripts/Script_TaxSettlement_Insert.js',
   'N/format',
   './Script_TaxSettlement_DeleteLines',
   'N/task',
   'N/file',
   './Util/getFolderId.js',
   '../Util/GetItemType.js'
],
   function (
      search,
      record,
      runtime,
      taxSetInsert,
      format,
      scriptDeleteLines,
      task,
      file,
      getFolderId,
      getItemType
   ) {

      //Global Variables
      var taxSettid = runtime.getCurrentScript().getParameter({ name: 'custscript_mts_recordid_mass' });
      var lastAddInvTextCode = 'A00000';
      var lastObsFiscalCode = 'O00000';
      var creatingObjectBlock = functionBlock();
      var defaultObsFiscalTexts = [];
      var taxSettlementRec = { id: 0 };
      var Buffer = {
         itemList: [],
         unitMeasureList: [],
         unitTypeList: [],
         accountList: [],
         internalICMSSPEDList: []
      };

      //Process
      function getInputData() {
         try {
            var taxSettlementObj = getTaxSettlementObj(taxSettid);

            if (!taxSettlementObj.datesToProcess) {
               log.debug({ title: 'onGetInputData', details: '#1' });
               scriptDeleteLines.eraseSpedLines(taxSettid);
            }

            // var taxSettlementRec = getTaxSettlement(taxSettid);
            submitTaxSettlementStatusField(
               taxSettid,
               {
                  custrecord_mts_statussped_taxsettlem: 1
               }
            );
            log.debug({ title: 'onGetInputData', details: 'Start TaxSettlement Process: ' + taxSettlementObj.name });

            // var startDate = handlingDateForFilter(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_startdate_taxsettlem' }));
            // var endDate = handlingDateForFilter(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_enddate_taxsettlem' }));
            var datesFilter = {
               startDate: '',
               endDate: ''
            };
            getDateFilter(taxSettlementObj, datesFilter);
            
            var filters = [];
            appendFilterInArray(filters, ['mainline', 'is', 'T']);
            appendFilterInArray(filters, ['posting', 'is', 'T']);
            // appendFilterInArray(filters, [[["type", "anyof", "VendCred", "VendBill", "CashSale", "CustInvc", "ItemShip", "ItemRcpt", "CuTrSale108"]], "OR", [["type", "anyof", "CustCred"], "AND", ["custbody_mts_postingtype", "anyof", "1"]]]);
            appendFilterInArray(filters, [[["type", "anyof", "VendCred", "VendBill", "CashSale", "CustInvc", "ItemRcpt", "CuTrSale108"]], "OR", [["type", "anyof", "CustCred"], "AND", ["custbody_mts_postingtype", "anyof", "1"]]]);

            if (taxSettlementObj.isGenerateEfdPisCofins) {
               appendFilterInArray(filters, ["custbody_mts_competencydate", "within", datesFilter.startDate, datesFilter.endDate]);

               if (taxSettlementObj.subsidiaryId)
                  appendFilterInArray(filters, ['subsidiary', 'is', taxSettlementObj.subsidiaryId]);

               appendFilterInArray(filters, [
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "01"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "1B"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "02"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "04"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "06"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "07"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "08"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "8b"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "09"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "10"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "11"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "21"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "22"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "26"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "27"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "28"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "29"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "55"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "57"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "63"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "65"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "66"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "67"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_notsubject_fiscaldoctype", "is", "T"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_efdblocks_fiscaldoctype", "is", "1"]
               ]);

            } else {

               appendFilterInArray(filters, ["trandate", "within", datesFilter.startDate, datesFilter.endDate]);

               if (taxSettObj.branchId)
                  appendFilterInArray(filters, ['custbody_mts_branchcode', 'is', taxSettObj.branchId]);

               appendFilterInArray(filters, [
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "01"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "1B"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "02"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "04"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "06"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "07"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "08"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "8b"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "09"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "10"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "11"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "21"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "22"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "26"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "27"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "28"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "29"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "55"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "57"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "63"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "65"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "66"],
                  "OR",
                  ["custbody_mts_fiscaldocumentype.custrecord_mts_elecfilecod_fiscaldoctype", "is", "67"]
               ]);
            }

            var transactionSearch = search.create({
               type: "transaction",
               filters: filters,
               columns:
                  [
                     "internalid",
                     "recordtype",
                     "custbody_mts_keynfe",
                     "custbody_mts_itemnfeprocess",
                     search.createColumn({
                        name: 'custrecord_mts_nfeshelf_fiscaldoctype',
                        join: 'custbody_mts_fiscaldocumentype'
                     }),
                     search.createColumn({      // LocBr20.03
                        name: 'custrecord_mts_protocol_eletiteminvproc',
                        join: 'custbody_mts_itemnfeprocess'
                     }),
                     search.createColumn({      // LocBr20.03
                        name: 'custrecord_mts_cancelpro_eletiteminvproc',
                        join: 'custbody_mts_itemnfeprocess'
                     }),
                     search.createColumn({      // LocBr20.03
                        name: 'custrecord_mts_inutprot_eletiteminvproc',
                        join: 'custbody_mts_itemnfeprocess'
                     }),
                     search.createColumn({
                        name: 'custrecord_mts_negativereturn_returncode',
                        join: 'custbody_mts_returncode'
                     })
                  ]
            });

            log.debug({title: 'OnGetInputData', details: 'Count: ' + transactionSearch.runPaged().count});

            return transactionSearch;
         } catch (e) {
            log.debug({ title: 'onGetInputData-Error', details: e });
            submitTaxSettlementStatusField(
               taxSettid,
               {
                  custrecord_mts_statussped_taxsettlem: 3,
                  custrecord_mts_dtstoproc_taxsettlem_tmp: ''
               }
            );
            throw new Error(e);
         }
      }

      function map(context) {
         // try{
         var transactionData = JSON.parse(context.value);
         log.debug({ title: 'onMap', details: transactionData.recordType + ': ' + transactionData.id });

         if (transactionData.values["custrecord_mts_nfeshelf_fiscaldoctype.custbody_mts_fiscaldocumentype"] == 'T'){
            if (transactionData.values["custbody_mts_itemnfeprocess"]){
               if (
                  !transactionData.values["custrecord_mts_protocol_eletiteminvproc.custbody_mts_itemnfeprocess"] &&        // LocBr20.03
                  !transactionData.values["custrecord_mts_cancelpro_eletiteminvproc.custbody_mts_itemnfeprocess"] &&       // LocBr20.03
                  !transactionData.values["custrecord_mts_inutprot_eletiteminvproc.custbody_mts_itemnfeprocess"]           // LocBr20.03
               )
                  return;
            }else{
               if (!transactionData.values["custbody_mts_keynfe"] || transactionData.values["custrecord_mts_negativereturn_returncode.custbody_mts_returncode"] == 'T')
                  return;
            }
         }

         log.debug({ title: 'onMap', details: 'start createTransacObj - ' + transactionData.recordType + '-' + transactionData.id + ': ' + JSON.stringify(new Date) });
         var transactionObj = createObjectWithDataOfTransaction(transactionData);
         log.debug({ title: 'onMap', details: 'end createTransacObj: ' + JSON.stringify(new Date) });

         if (taxSettlementRec.id != taxSettid)
            taxSettlementRec = getTaxSettlement(taxSettid);

         var isSpedContribution = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });

         if (isSpedContribution) {
            if (
               Object.keys(transactionObj.transacBodyFields.fiscalDocTypeObj).length &&
               transactionObj.transacBodyFields.fiscalDocTypeObj.notsubjecticms
            ) {
               creatingObjectBlock.Block0(null, taxSettlementRec);
               creatingObjectBlock.BlockA(transactionObj, taxSettlementRec);
               creatingObjectBlock.BlockC(null, taxSettlementRec);
               creatingObjectBlock.BlockD(null, taxSettlementRec);
               creatingObjectBlock.BlockE(null, taxSettlementRec);
               creatingObjectBlock.BlockF(transactionObj, taxSettlementRec);
               creatingObjectBlock.Block1(null, taxSettlementRec);

            } else {

               creatingObjectBlock.Block0(transactionObj, taxSettlementRec);
               creatingObjectBlock.BlockA(null, taxSettlementRec);
               creatingObjectBlock.BlockC(transactionObj, taxSettlementRec);
               creatingObjectBlock.BlockD(transactionObj, taxSettlementRec);
               creatingObjectBlock.BlockE(null, taxSettlementRec);
               creatingObjectBlock.BlockF(transactionObj, taxSettlementRec);
               creatingObjectBlock.Block1(transactionObj, taxSettlementRec);
            }
         } else {
            log.debug({ title: 'onMap', details: 'start createBlockA: ' + JSON.stringify(new Date) });
            creatingObjectBlock.BlockA(null, taxSettlementRec);
            log.debug({ title: 'onMap', details: 'end createBlockA: ' + JSON.stringify(new Date) });

            log.debug({ title: 'onMap', details: 'start createBlock0: ' + JSON.stringify(new Date) });
            creatingObjectBlock.Block0(transactionObj, taxSettlementRec);
            log.debug({ title: 'onMap', details: 'end createBlock0: ' + JSON.stringify(new Date) });

            log.debug({ title: 'onMap', details: 'start createBlockC: ' + JSON.stringify(new Date) });
            creatingObjectBlock.BlockC(transactionObj, taxSettlementRec);
            log.debug({ title: 'onMap', details: 'end createBlockC: ' + JSON.stringify(new Date) });

            log.debug({ title: 'onMap', details: 'start createBlockD: ' + JSON.stringify(new Date) });
            creatingObjectBlock.BlockD(transactionObj, taxSettlementRec);
            log.debug({ title: 'onMap', details: 'end createBlockD: ' + JSON.stringify(new Date) });

            log.debug({ title: 'onMap', details: 'start createBlockE: ' + JSON.stringify(new Date) });
            creatingObjectBlock.BlockE(transactionObj, taxSettlementRec);
            log.debug({ title: 'onMap', details: 'end createBlockE: ' + JSON.stringify(new Date) });

            log.debug({ title: 'onMap', details: 'start createBlockF: ' + JSON.stringify(new Date) });
            creatingObjectBlock.BlockF(null, taxSettlementRec);
            log.debug({ title: 'onMap', details: 'end createBlockF: ' + JSON.stringify(new Date) });

            log.debug({ title: 'onMap', details: 'start createBlock1: ' + JSON.stringify(new Date) });
            creatingObjectBlock.Block1(null, taxSettlementRec);
            log.debug({ title: 'onMap', details: 'end createBlock1: ' + JSON.stringify(new Date) });
         }

         log.debug({ title: 'onMap', details: 'start MakePercentAbstract: ' + JSON.stringify(new Date) });
         creatingObjectBlock.MakePercentAbstract(transactionObj);
         log.debug({ title: 'onMap', details: 'end MakePercentAbstract: ' + JSON.stringify(new Date) });

         log.debug({ title: 'onMap', details: 'start MakeStateAbstract: ' + JSON.stringify(new Date) });
         creatingObjectBlock.MakeStateAbstract(transactionObj);
         log.debug({ title: 'onMap', details: 'end MakeStateAbstract: ' + JSON.stringify(new Date) });

         log.debug({ title: 'onMap', details: 'start MakeCFOPAbstract: ' + JSON.stringify(new Date) });
         creatingObjectBlock.MakeCFOPAbstract(transactionObj);
         log.debug({ title: 'onMap', details: 'end MakeCFOPAbstract: ' + JSON.stringify(new Date) });

         creatingObjectBlock.objBlock.transactionId = transactionObj.transactionId;
         context.write(transactionObj.transactionId, JSON.stringify(creatingObjectBlock.objBlock));
      }

      function reduce(context) {
         // try{
         log.debug({ title: 'onReduce', details: 'start loadTaxSettlement' });
         var taxSettlementRec = {
            id: taxSettid
         }
         //getTaxSettlement(taxSettid);
         log.debug({ title: 'onReduce', details: 'end loadTaxSettlement' });

         var blockObj = JSON.parse(context.values[0]);

         if (Object.keys(blockObj.BlockA._a100Obj).length) {
            log.debug({ title: 'onReduce', details: 'start insertA100' });
            taxSetInsert.insertA100(blockObj.BlockA._a100Obj, taxSettlementRec);
            log.debug({ title: 'onReduce', details: 'end insertA100' });
         }
         if (Object.keys(blockObj.BlockC._c100Obj).length) {
            log.debug({ title: 'onReduce', details: 'start insertC100' });
            taxSetInsert.insertC100(blockObj.BlockC._c100Obj, taxSettlementRec);
            log.debug({ title: 'onReduce', details: 'end insertC100' });
         }
         if (Object.keys(blockObj.BlockC._c500Obj).length) {
            log.debug({ title: 'onReduce', details: 'start insertC500' });
            taxSetInsert.insertC500(blockObj.BlockC._c500Obj, taxSettlementRec);
            log.debug({ title: 'onReduce', details: 'end insertC500' });
         }

         if (Object.keys(blockObj.BlockD._d100Obj).length) {
            log.debug({ title: 'onReduce', details: 'start insertD100' });
            taxSetInsert.insertD100(blockObj.BlockD._d100Obj, taxSettlementRec);
            log.debug({ title: 'onReduce', details: 'end insertD100' });
         }
         if (Object.keys(blockObj.BlockD._d500Obj).length) {
            log.debug({ title: 'onReduce', details: 'start insertD500' });
            taxSetInsert.insertD500(blockObj.BlockD._d500Obj, taxSettlementRec);
            log.debug({ title: 'onReduce', details: 'end insertD500' });
         }

         if (blockObj.BlockF._f100List.length) {
            log.debug({ title: 'onReduce', details: 'start insertF100' });
            taxSetInsert.insertF100(blockObj.BlockF._f100List, taxSettlementRec);
            log.debug({ title: 'onReduce', details: 'end insertF100' });
         }

         if (Object.keys(blockObj.PercentAbstractObj).length) {
            log.debug({ title: 'onReduce', details: 'start insertPercentAbstract' });
            taxSetInsert.insertPercentAbstract(blockObj.PercentAbstractObj, taxSettlementRec);
            log.debug({ title: 'onReduce', details: 'end insertPercentAbstract' });
         }

         // log.debug({title: 'onReduce', details: 'start saveTaxSettlement'});
         // taxSettlementRec.save();
         // log.debug({title: 'onReduce', details: 'end saveTaxSettlement'});

         context.write({ key: blockObj.transactionId, value: JSON.stringify(blockObj) })
      }

      function summarize(summary) {
         log.debug({ title: 'onSummarize', details: '#1 governance remaining: ' + runtime.getCurrentScript().getRemainingUsage() });

         log.debug({ title: 'onSummarize', details: 'start loadTaxSettlement: ' + JSON.stringify(new Date()) });
         var taxSettlementRec = getTaxSettlement(taxSettid);
         var taxSettlementObj = getTaxSettlementObj(taxSettid);
         log.debug({ title: 'onSummarize', details: 'end loadTaxSettlement: ' + JSON.stringify(new Date()) });

         log.debug({ title: 'onSummarize', details: '#2 governance remaining: ' + runtime.getCurrentScript().getRemainingUsage() });

         log.debug({ title: 'onSummarize', details: 'start mapAndReduceError: ' + JSON.stringify(new Date()) });
         mapAndReduceError(summary, taxSettlementRec);
         log.debug({ title: 'onSummarize', details: 'end mapAndReduceError: ' + JSON.stringify(new Date()) });

         log.debug({ title: 'onSummarize', details: '#3 governance remaining: ' + runtime.getCurrentScript().getRemainingUsage() });

         try {
            var isSpedContribution = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });

            var spedObj = initSpedBlock(isSpedContribution);
            var bookObj = initBook();

            getListsFromTaxSettlementRec(spedObj, bookObj, taxSettlementRec);

            log.debug({ title: 'onSummarize', details: 'start SummarizeBlocks: ' + JSON.stringify(new Date()) });
            summary.output.iterator().each(function (key, value) {
               var blockObj = JSON.parse(value);

               summarizeBlock0150(blockObj.Block0._0150Obj, spedObj.block0150List, isSpedContribution);
               summarizeBlock0190(blockObj.Block0._0190List, spedObj.block0190List, isSpedContribution);
               summarizeBlock0200(blockObj.Block0._0200List, spedObj.block0200List, isSpedContribution);
               summarizeBlock0400(blockObj.Block0._0400List, spedObj.block0400List, isSpedContribution);
               summarizeBlock0500(blockObj.Block0._0500List, spedObj.block0500List);
               summarizeCFOPAbstract(blockObj.CFOPAbstract, bookObj.CFOPAbstractList);
               summarizeStateAbstract(blockObj.StateAbstractObj, bookObj.StateAbstractList);

               if (!isSpedContribution) {
                  fillTableAuxDetailBlockE115(blockObj.BlockE._e115List, taxSettlementRec);

                  summarizeBlockD695(blockObj.BlockD._d695Obj, spedObj.blockD695List);
                  summarizeBlockE115(blockObj.BlockE._e115List, spedObj.blockE115List);
                  summarizeBlockE200(blockObj.BlockE._e200Obj, spedObj.blockE200List);
                  summarizeBlockE300(blockObj.BlockE._e300Obj, spedObj.blockE300List);
                  summarizeBlockE510(blockObj.BlockE._e510List, spedObj.blockE510List);
               }

               if (isSpedContribution) {
                  summarizeBlockD600(blockObj.BlockD._d600Obj, spedObj.blockD600List);
                  log.audit('BLOCO D', blockObj.BlockD._d600Obj)
                  summarizeBlock1900(blockObj.Block1._1900Obj, spedObj.block1900List);
               }

               return true;
            });

            log.debug({ title: 'onSummarize', details: 'end SummarizeBlocks: ' + JSON.stringify(new Date()) });

            log.debug({ title: 'onSummarize', details: '#4 governance remaining: ' + runtime.getCurrentScript().getRemainingUsage() });

            log.debug({ title: 'onSummarize', details: 'start insertSPED: ' + JSON.stringify(new Date()) });
            //Esta logica precisa ficar antes do insert dos blocos 0150,0190,0200
            if (!isSpedContribution)
               insertSpedFiscal(spedObj, taxSettlementRec)
            else if (isSpedContribution)
               insertSpedContribution(spedObj, taxSettlementRec)
            log.debug({ title: 'onSummarize', details: 'end insertSPED: ' + JSON.stringify(new Date()) });

            log.debug({ title: 'onSummarize', details: '#5 governance remaining: ' + runtime.getCurrentScript().getRemainingUsage() });

            log.debug({ title: 'onSummarize', details: 'start insert0150-0190-0200-0400: ' + JSON.stringify(new Date()) });
            if (spedObj.block0150List.length > 0)
               taxSetInsert.insert0150(spedObj.block0150List, taxSettlementRec);
            if (spedObj.block0190List.length > 0)
               taxSetInsert.insert0190(spedObj.block0190List, taxSettlementRec);
            if (spedObj.block0200List.length > 0)
               taxSetInsert.insert0200(spedObj.block0200List, taxSettlementRec);
            if (spedObj.block0400List.length > 0)
               taxSetInsert.insert0400(spedObj.block0400List, taxSettlementRec);
            log.debug({ title: 'onSummarize', details: 'end insert0150-0190-0200-0400: ' + JSON.stringify(new Date()) });

            log.debug({ title: 'onSummarize', details: '#6 governance remaining: ' + runtime.getCurrentScript().getRemainingUsage() });

            log.debug({ title: 'onSummarize', details: 'start insertCfopAndStateAbstract: ' + JSON.stringify(new Date()) });
            if (bookObj.CFOPAbstractList.length > 0)
               taxSetInsert.insertCfopAbstract(bookObj.CFOPAbstractList, taxSettlementRec);
            if (bookObj.StateAbstractList.length > 0)
               taxSetInsert.insertStateAbstract(bookObj.StateAbstractList, taxSettlementRec);
            log.debug({ title: 'onSummarize', details: 'end insertCfopAndStateAbstract: ' + JSON.stringify(new Date()) });

            log.debug({ title: 'onSummarize', details: '#7 governance remaining: ' + runtime.getCurrentScript().getRemainingUsage() });

            log.debug({ title: 'onSummarize', details: 'start NFeAnnulment: ' + JSON.stringify(new Date()) });
            var eletronicInvProcessList = searchingForNFeAnnulmentAndDenegation(taxSettlementRec);
            changeOrCreateBlockLineC100(taxSettlementRec, eletronicInvProcessList);
            changeOrCreateBlockLinePercentAbstract(taxSettlementRec, eletronicInvProcessList);
            log.debug({ title: 'onSummarize', details: 'end NFeAnnulment: ' + JSON.stringify(new Date()) });

            log.debug({ title: 'onSummarize', details: 'start saveTaxSettlement: ' + JSON.stringify(new Date()) });
            taxSettlementRec.save();
            log.debug({ title: 'onSummarize', details: 'end saveTaxSettlement: ' + JSON.stringify(new Date()) });

            if (taxSettlementObj.datesToProcess) {
               var mrSPEDTask = task.create({
                  taskType: task.TaskType.MAP_REDUCE,
                  scriptId: 'customscript_mts_filledobjsped_mr',
                  params: {
                     'custscript_mts_recordid_mass': String(taxSettid)
                  }
               });
               var taskId = mrSPEDTask.submit();
            } else {
               if (!isSpedContribution) {
                  if (taxSettlementObj.generateBlockK || taxSettlementObj.inventoryDate){
                     // Block K-H
                     runTaskBlockKH(taxSettlementObj);
                  }else{
                     // Block G
                     var taskCreated = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_mts_spedciapmanag_mr',
                        // deploymentId : 'customdeploy_mts_spedciapmanag_mr',
                        params: {
                           'custscript_mts_spedciaprecordid_mass': String(taxSettlementRec.id)
                        }
                     });
                     var taskId = taskCreated.submit();
                  }
                  
               } else {
                  //Block F500
                  //Block F525
                  //Block M400
                  //Block M410
                  //Block M800
                  //Block M810
                  var paymentSpedTask = task.create({
                     taskType: task.TaskType.MAP_REDUCE,
                     scriptId: 'customscript_mts_mr_fillspedpayment',
                     // deploymentId : 'customdeploy_mts_mr_fillspedpayment',
                     params: {
                        'custscript_mts_recid_fillspedpayment': String(taxSettid)
                     }
                  });

                  paymentSpedTask.submit();
               }
            }

         } catch (e) {
            log.debug({ title: 'onSummarizeError', details: JSON.stringify(e) });
            submitTaxSettlementStatusField(
               taxSettid,
               {
                  custrecord_mts_statussped_taxsettlem: 3,
                  custrecord_mts_dtstoproc_taxsettlem_tmp: ''
               }
            );
            throw new Error(e);
         }
      }

      function mapAndReduceError(summary, taxSettlementRec) {
         var taxSettName = taxSettlementRec.getValue({ fieldId: 'name' });

         // Create the CSV file
         var csvErrorFile = file.create({
            name: taxSettName + '_errorlog.csv',
            contents: 'stage;tranId;error_message;error_object\n',
            folder: getFolderId(), //1324,
            fileType: 'CSV'
         });

         summary.mapSummary.errors.iterator().each(function (key, error, executionNo) {
            log.debug({
               title: 'Map error for key: ' + key + ', execution no. ' + executionNo,
               details: error
            });

            csvErrorFile.appendLine({
               value: 'onMap;' + key + ';' + JSON.parse(error).message + ';' + error
            });

            return true;
            // throw new Error(error)
         });

         summary.reduceSummary.errors.iterator().each(function (key, error, executionNo) {
            log.debug({
               title: 'Reduce error for key: ' + key + ', execution no. ' + executionNo,
               details: error
            });

            csvErrorFile.appendLine({
               value: 'onReduce;' + key + ';' + JSON.parse(error).message + ';' + error
            });

            return true;
            // throw new Error(error)
         });

         var csvFileId = csvErrorFile.save();
         log.debug({ title: 'Summary', details: 'File Log Id: ' + csvFileId });
      }


      function submitTaxSettlementStatusField(taxSettid, valuesObj) {
         var id = record.submitFields({
            type: 'customrecord_mts_taxsettlem',
            id: taxSettid,
            values: valuesObj,
            options: {
               enableSourcing: false,
               ignoreMandatoryFields: true,
               disableTriggers: true
            }
         });
      }



      //getInputData Structure
      function appendFilterInArray(filterlist, filter) {
         if (filterlist.length)
            filterlist.push("AND");
         filterlist.push(filter);
      }
      function handlingDateForFilter(date) {

         var date = format.format({
            value: date,
            type: format.Type.DATE
         });

         return date;
      }
      function handlingDateForField(date) {
         var date = format.parse({
            value: date,
            type: format.Type.DATE
         });

         return date;
      }
      function getDateFilter(taxSettlementObj, datesFilterObj) {
         var dateRangeList = [];

         if (taxSettlementObj.datesToProcess) {
            dateRangeList = JSON.parse(taxSettlementObj.datesToProcess);
         } else {
            var newDate = new Date(taxSettlementObj.startDate);

            while (newDate.getTime() <= taxSettlementObj.endDate.getTime()) {
               var newDateFtt = handlingDateForFilter(newDate);
               dateRangeList.push(newDateFtt);
               newDate.setDate(newDate.getDate() + 1);
            }
         }

         datesFilterObj.startDate = dateRangeList[0];
         datesFilterObj.endDate = dateRangeList[0];
         dateRangeList.splice(0, 1);

         // update new dates to process in Tax Settlement record
         var newDatesToProcess = '';
         if (dateRangeList.length) {
            newDatesToProcess = JSON.stringify(dateRangeList);
         }
         var id = record.submitFields({
            type: 'customrecord_mts_taxsettlem',
            id: taxSettlementObj.id,
            values: {
               custrecord_mts_dtstoproc_taxsettlem_tmp: newDatesToProcess
            },
            options: {
               enableSourcing: false,
               ignoreMandatoryFields: true,
               disableTriggers: true
            }
         });
      }


      //Map Structure
      function createObjectWithDataOfTransaction(transactionData) {
         var functionAux = funcAuxFillFields();

         log.debug({ title: 'onMap', details: 'start createTransacObj - header:' + JSON.stringify(new Date) });
         var transacRec = record.load({
            type: transactionData.recordType,
            id: transactionData.id
         });

         log.debug({ title: 'onMap', details: 'start createTransacObj - feedLists:' + JSON.stringify(new Date) });
         feedBufferLists(transacRec);
         log.debug({ title: 'onMap', details: 'end createTransacObj - feedLists:' + JSON.stringify(new Date) });

         var complementTransacBodyFields = {
            customsale_mts_transferinvoice_tr: function (transacBodyFields) {
               transacBodyFields.termObj = transacRec.getValue({ fieldId: 'custbody_mts_terms' });
               transacBodyFields.qtyInstallments = 0;

               transacBodyFields.billingAddress.address = transacBodyFields.entityObj.address;
               transacBodyFields.billingAddress.number = transacBodyFields.entityObj.number;
               transacBodyFields.billingAddress.complement = transacBodyFields.entityObj.address2;
               transacBodyFields.billingAddress.district = transacBodyFields.entityObj.district;
               transacBodyFields.billingAddress.zipCode = transacBodyFields.entityObj.zipCode;
               transacBodyFields.billingAddress.ibgecityCode = transacBodyFields.entityObj.ibgeCityCode;
               transacBodyFields.billingAddress.city = transacBodyFields.entityObj.city;
               transacBodyFields.billingAddress.state = transacBodyFields.entityObj.state;
               transacBodyFields.billingAddress.country = transacBodyFields.entityObj.country;
               transacBodyFields.billingAddress.countryDescription = transacBodyFields.entityObj.countryDescription;
               transacBodyFields.billingAddress.countryBacenCode = transacBodyFields.entityObj.bacenCountryCode;
            },
            itemreceipt: function (transacBodyFields) {
               transacBodyFields.termObj = {};
               transacBodyFields.qtyInstallments = 0;

               transacBodyFields.billingAddress.address = transacBodyFields.entityObj.address;
               transacBodyFields.billingAddress.number = transacBodyFields.entityObj.number;
               transacBodyFields.billingAddress.complement = transacBodyFields.entityObj.address2;
               transacBodyFields.billingAddress.district = transacBodyFields.entityObj.district;
               transacBodyFields.billingAddress.zipCode = transacBodyFields.entityObj.zipCode;
               transacBodyFields.billingAddress.ibgecityCode = transacBodyFields.entityObj.ibgeCityCode;
               transacBodyFields.billingAddress.city = transacBodyFields.entityObj.city;
               transacBodyFields.billingAddress.state = transacBodyFields.entityObj.state;
               transacBodyFields.billingAddress.country = transacBodyFields.entityObj.country;
               transacBodyFields.billingAddress.countryDescription = transacBodyFields.entityObj.countryDescription;
               transacBodyFields.billingAddress.countryBacenCode = transacBodyFields.entityObj.bacenCountryCode;
            }
         }

         var transacBodyFields = {
            fiscalDocTypeObj: getFiscDocTypeFields(transacRec.getValue({ fieldId: 'custbody_mts_fiscaldocumentype' })),
            operationTypeObj: functionAux.getOperationType(transacRec.getValue({ fieldId: 'custbody_mts_operationtype' })),
            paymentMethodObj: functionAux.getPaymentMethod(transacRec.getValue({ fieldId: 'custbody_mts_paymentmethodcode' })),
            returnCodeObj: getReturnCodeObj(transacRec.getValue({ fieldId: 'custbody_mts_returncode' })),
            termObj: functionAux.getTerm(transacRec.getValue({ fieldId: 'term' })),
            creditOrReturn: transacRec.getValue({ fieldId: 'custbody_mts_creditreturn' }) || '',
            entityObj: functionAux.getEntity(transacRec),
            billingAddress: getBillingAddress(transacRec),
            nfeProcessObj: functionAux.getNFeProcess(transacRec.getValue({ fieldId: 'custbody_mts_itemnfeprocess' })),
            nfeKeyAccessThirdIssue: transacRec.getValue({ fieldId: 'custbody_mts_nfekeyaccessthirdissue' }),
            keyAccess: transacRec.getValue({ fieldId: 'custbody_mts_keynfe' }),
            freightBilledTo: transacRec.getText({ fieldId: 'custbody_mts_freightbilledto' }),
            printSerie: transacRec.getValue({ fieldId: 'custbody_mts_printserie' }),
            printSubSerie: transacRec.getValue({ fieldId: 'custbody_mts_printsubserie' }),
            docDate: transacRec.getValue({ fieldId: 'custbody_document_date' }),
            noDi: transacRec.getValue({ fieldId: 'custbody_mts_nodi' }),
            compInvType: transacRec.getValue({ fieldId: 'custbody_mts_complementaryinvoicetype' }),
            invToComp: transacRec.getValue({ fieldId: 'custbody_mts_invoicetocomplement' }),
            endUser: transacRec.getValue({ fieldId: 'custbody_mts_enduser' }),
            fiscalType: getSourceType(transacRec.type), // 2= output  1= input
            invoiceReason: transacRec.getValue({ fieldId: 'custbody_mts_invoicingreason' }),
            fiscalShipment: transacRec.getValue({ fieldId: 'custbody_mts_fiscalshipment' }) || '',
            directImport: transacRec.getValue({ fieldId: 'custbody_mts_directimport' }) || false,
            territory: getTerritory(transacRec.getValue({ fieldId: 'custbody_mts_territorycode' })),
            qtyInstallments: transacRec.getLineCount({ sublistId: 'installment' }) || 0,
            transportedQuantity: transacRec.getValue({ fieldId: 'custbody_mts_transportedquantity' }) || 0,
            externalDocNo: transacRec.getValue({ fieldId: 'custbody_mts_externaldocno' }) || '',
            date: transacRec.getValue({ fieldId: 'trandate' }) || '',
            branchCodeObj: functionAux.getBranch(transacRec.getValue({ fieldId: 'custbody_mts_branchcode' })),
            subsidiary: transacRec.getValue({ fieldId: 'subsidiary' }),
            shipmentAdviceType: transacRec.getText({ fieldId: 'custbody_mts_shipmentadvicetype' }),
            originIbgeCityCode: transacRec.getValue({ fieldId: 'custbody_mts_originibgecitycode' }),
            destIbgeCityCode: transacRec.getValue({ fieldId: 'custbody_mts_destinationibgecitycode' }),
            masterDigitalAuthCode: transacRec.getValue({ fieldId: 'custbody_mts_masterdigiauthencode' }) || '',
            fileNameMaster: transacRec.getValue({ fieldId: 'custbody_mts_filenamemastertaxdoc' }) || '',
            indicatorNatureOfFreight: transacRec.getValue({ fieldId: 'custbody_mts_indicatornatureoffreight' }) || '',
            hashSubDoc:transacRec.getValue({ fieldId: 'custbody_mts_hashsubsdocument' }) || '',
            postingType: transacRec.type == 'creditmemo' ? transacRec.getValue({ fieldId: 'custbody_mts_postingtype' }) : '',
            getEntityCode: function () {
               var typeChr = '';
               if (this.entityObj.type == 'customer') {
                  typeChr = 'C';
               } else {
                  typeChr = 'F';
               }

               return this.entityObj.id + typeChr + this.billingAddress.zipCode;
            }
         };

         complementTransacBodyFieldsFunc = complementTransacBodyFields[transacRec.type];
         if (complementTransacBodyFieldsFunc != undefined && complementTransacBodyFieldsFunc != null){
            complementTransacBodyFieldsFunc(transacBodyFields);
         }
         log.debug({ title: 'onMap', details: 'end createTransacObj - header:' + JSON.stringify(new Date) });

         log.debug({ title: 'onMap', details: 'start createTransacObj - lines:' + JSON.stringify(new Date) });
         var transactionSublistFields = {
            additionalInvTextList: (function () {
               var lines = transacRec.getLineCount({ sublistId: 'recmachcustrecord_mts_transaction_addinvlt' });
               var addinvTextList = [];

               for (var i = 0; i < lines; i++) {
                  addinvTextList.push({
                     text: transacRec.getSublistValue({ sublistId: 'recmachcustrecord_mts_transaction_addinvlt', fieldId: 'custrecord_mts_text_addinvlt', line: i }),
                     code: sumLastCode(lastAddInvTextCode)
                  });
               }
               return addinvTextList;
            })(),

            observationFiscalTextList: (function () {
               var lines = transacRec.getLineCount({ sublistId: 'recmachcustrecord_mts_transaction_obsfiscaltext' });
               var obsFiscTextList = [];

               for (var i = 0; i < lines; i++) {
                  obsFiscTextList.push({
                     text: transacRec.getSublistValue({ sublistId: 'recmachcustrecord_mts_transaction_obsfiscaltext', fieldId: 'custrecord_mts_text_obsfiscaltext', line: i }),
                     code: sumLastCode(lastObsFiscalCode)
                  });
               }
               return obsFiscTextList;
            })(),

            itemList: (function () {
               var lines = transacRec.getLineCount({ sublistId: 'item' });
               var injectedEnergy = 0
               var otherDeductions = 0
               var itemList = [];

               for (var i = 0; i < lines; i++) {
                  var itemType = transacRec.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });

                  if (itemType != 'Payment') {
                     var documentNoReference = '';
                     var documentReferenceType = '';

                     if (transacRec.type == 'creditmemo') {
                        documentNoReference = transacRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_docnoreference', line: i });
                        documentReferenceType = transacRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_docreftype', line: i })
                     }

                     var itemNo = transacRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                     var unit = transacRec.getSublistText({ sublistId: 'item', fieldId: 'units', line: i })
                     var grossAmount = transacRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_brgrossamount', line: i })
                     var invoiceLineNo = transacRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_lineno', line: i })
                     if(transacRec.type == 'purchaseorder'){
                        injectedEnergy = transacRec.getSublistValue({sublistId:'item',fieldId:'custcol_mts_injectedenergy',line:i}) || 0
                        otherDeductions = transacRec.getSublistValue({sublistId:'item',fieldId:'custcol_mts_otherdeductions',line:i}) || 0    
                    }

                     itemList.push({
                        itemObj: getItemPerType(itemType, itemNo, transacBodyFields),
                        documentReferenceObj: getDocumentReference(documentReferenceType, documentNoReference),
                        unit: unit,
                        unitMeasureObj: getUnitMeasureFromBuffer(unit),
                        grossAmount: grossAmount,
                        invoiceLineNo: invoiceLineNo,
                        injectedEnergy: injectedEnergy += injectedEnergy,
                        otherDeductions: otherDeductions += otherDeductions
                     });
                  }
               }
               return itemList;
            })(),

            installmentList: (function () {
               var lines = transacRec.getLineCount({ sublistId: 'installment' });
               var installmentList = [];

               for (var i = 0; i < lines; i++) {
                  installmentList.push({
                     installmentNumber: transacRec.getSublistValue({ sublistId: 'installment', fieldId: 'seqnum', line: i }),
                     dueDate: transacRec.getSublistValue({ sublistId: 'installment', fieldId: 'duedate', line: i }),
                     amountDue: transacRec.getSublistValue({ sublistId: 'installment', fieldId: 'amountdue', line: i })
                  });
               }
               return installmentList;
            })(),
         };
         log.debug({ title: 'onMap', details: 'end createTransacObj - lines:' + JSON.stringify(new Date) });

         log.debug({ title: 'onMap', details: 'start createTransacObj - statisticBr:' + JSON.stringify(new Date) });
         var headerloc = {};
         var headerLocBodyFields = {};
         var headerlocSublistFields = {
            totalloc: {},
            detaillocList: [],
            linelocList: []
         };

         var headerlocId = transacRec.getValue({ fieldId: 'custbody_mts_taxcalculationid' });
         if (headerlocId) {
            headerloc = record.load({
               type: 'customrecord_mts_headerlocvat',
               id: headerlocId,
               isDynamic: true
            });

            headerLocBodyFields = {
               totalDiscountAmount: headerloc.getValue({ fieldId: 'custrecord_mts_totaldiscamount_hdrlocvat' }) || 0,
               TotalAmountWithIncludedTaxes: headerloc.getValue({ fieldId: 'custrecord_mts_amtincludedtax_hdrlocvat' }) || 0,
               totalAmountDiscount: headerloc.getValue({ fieldId: 'custrecord_mts_totamtdiscounted_hdrlocva' }) || 0,
               totalAmountBilled: headerloc.getValue({ fieldId: 'custrecord_mts_totalamtbilled_hdrlocvat' }) || 0,
            };

            headerlocSublistFields = {
               totalloc: {
                  vl_fcp_op: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_fcpamount_detlocvat', 'ICMS') || 0,
                  vl_fcp_st: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_fcpamount_detlocvat', 'ST') || 0,
                  vl_fcp_ret: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_fcpamount_detlocvat', 'ST') || 0,

                  sum_ICMS_BasisAmount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_base_detlocvat', 'ICMS') || 0,
                  sum_ICMS_Amount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_amount_detlocvat', 'ICMS') || 0,
                  sum_ICMS_ExemptAmount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_exemptbasisamou_detlocvat', 'ICMS') || 0,
                  sum_ICMS_OtherBasisAmount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_othersbasisamou_detlocvat', 'ICMS') || 0,
                  sum_ST_ICMSbasisAmount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_base_detlocvat', 'ST') || 0,
                  sum_ST_ICMSamount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_amount_detlocvat', 'ST') || 0,
                  sum_IPI_Amount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_amount_detlocvat', 'IPI') || 0,
                  sum_IPI_BasisAmount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_base_detlocvat', 'IPI') || 0,
                  sum_IPI_OtherBasisAmount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_othersbasisamou_detlocvat', 'IPI') || 0,
                  sum_IPI_ExemptAmount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_exemptbasisamou_detlocvat', 'IPI') || 0,
                  sum_PIS_Amount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_amount_detlocvat', 'PIS') || 0,
                  sum_PIS_BasisAmount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_base_detlocvat', 'PIS') || 0,
                  sum_COFINS_Amount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_amount_detlocvat', 'COFINS') || 0,
                  sum_COFINS_BasisAmount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_base_detlocvat', 'COFINS') || 0,
                  sum_ISS_BasisAmount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_base_detlocvat', 'ISS') || 0,
                  sum_ISS_Amount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_amount_detlocvat', 'ISS') || 0,
                  sum_PISRet_Amount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_amount_detlocvat', 'PIS Ret.') || 0,
                  sum_COFINSRet_Amount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_amount_detlocvat', 'COFINS Ret.') || 0,
                  sum_CSRF_Amount: functionAux.sumFieldsOfDetailLoc_FilteringTaxIdent(headerloc, 'custrecord_mts_amount_detlocvat', 'CSRF') || 0,

                  sum_ExemptionICMS: functionAux.sumFieldsOfSublistHeaderLoc(headerloc, 'recmachcustrecord_mts_headerlocvat_detlocvat', 'custrecord_mts_exemptionicms_detlocvat') || 0,
                  sum_AmountFCP: functionAux.sumFieldsOfSublistHeaderLoc(headerloc, 'recmachcustrecord_mts_headerlocvat_detlocvat', 'custrecord_mts_fcpamount_detlocvat') || 0,
                  sum_AddresseeShareICMS: functionAux.sumFieldsOfSublistHeaderLoc(headerloc, 'recmachcustrecord_mts_headerlocvat_detlocvat', 'custrecord_mts_icmsaddresssha_detlocvat') || 0,
                  sum_ShipperShareICMS: functionAux.sumFieldsOfSublistHeaderLoc(headerloc, 'recmachcustrecord_mts_headerlocvat_detlocvat', 'custrecord_mts_icmshippershare_detlocvat') || 0,

                  //sum_AmountWithIncludedTaxes: headerloc.getValue({fieldId:'custrecord_mts_amtincludedtax_hdrlocvat'}),  //headerloc ? functionAux.sumFieldsOfSublistHeaderLoc(headerloc,'recmachcustrecord_mts_headerlocvat_linelocvat','custrecord_mts_amtwithinclude_linelocvat') : 0,
                  sum_TotalAmount: functionAux.sumFieldsOfSublistHeaderLoc(headerloc, 'recmachcustrecord_mts_headerlocvat_linelocvat', 'custrecord_mts_totalamount_linelocvat') || 0,
                  sum_BRlineDiscountAmount: functionAux.sumFieldsOfSublistHeaderLoc(headerloc, 'recmachcustrecord_mts_headerlocvat_linelocvat', 'custrecord_mts_brlinedisamt_linelocvat') || 0,

                  perc_ICMS: functionAux.getFieldPerTax(headerloc, 'ICMS', 'custrecord_mts_tax_detlocvat'),
                  cstCodeICMS: functionAux.getFieldPerTax(headerloc, 'ICMS', 'custrecord_mts_icmscstcode_detlocvat'),
                  perc_IPI: functionAux.getFieldPerTax(headerloc, 'IPI', 'custrecord_mts_tax_detlocvat'),
                  cstCodeIPI: functionAux.getFieldPerTax(headerloc, 'IPI', 'custrecord_mts_ipicstcode_detlocvat'),
                  perc_PIS: functionAux.getFieldPerTax(headerloc, 'PIS', 'custrecord_mts_tax_detlocvat'),
                  cstCodePIS: functionAux.getFieldPerTax(headerloc, 'PIS', 'custrecord_mts_piscstcode_detlocvat'),
                  perc_COFINS: functionAux.getFieldPerTax(headerloc, 'COFINS', 'custrecord_mts_tax_detlocvat'),
                  cstCodeCOFINS: functionAux.getFieldPerTax(headerloc, 'COFINS', 'custrecord_mts_cofinscstcode_detlocvat'),
                  perc_ST: functionAux.getFieldPerTax(headerloc, 'ST', 'custrecord_mts_tax_detlocvat'),
                  perc_ISS: functionAux.getFieldPerTax(headerloc, 'ISS', 'custrecord_mts_tax_detlocvat'),
               },

               detaillocList: (function () {
                  var lines = headerloc.getLineCount({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat' }) || 0;
                  var detaillocList = [];

                  for (var i = 0; i < lines; i++) {
                     detaillocList.push({
                        invoiceLineNo: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_invoicelineno_detlocvat', line: i }),
                        billPayToNo: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_billtopaytono_detlocvat', line: i }),
                        externalDocNo: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_externaldocno_detlocvat', line: i }),
                        postingDate: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_postingdate_detlocvat', line: i }),
                        noTaxCredit: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_notaxcredit_detlocvat', line: i }),
                        cfopCode: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_cfopcode_detlocvat', line: i }),
                        cfopDesc: headerloc.getSublistText({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_operationdescri_detlocvat', line: i }),
                        cfopSequentialCode: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_cfopsequential_detlocvat', line: i }),
                        cstCodeIPI: headerloc.getSublistText({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_ipicstcode_detlocvat', line: i }),
                        cstCodePIS: headerloc.getSublistText({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_piscstcode_detlocvat', line: i }),
                        cstCodeCOFINS: headerloc.getSublistText({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_cofinscstcode_detlocvat', line: i }),
                        cstCodeICMS: headerloc.getSublistText({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_icmscstcode_detlocvat', line: i }),
                        taxIdent: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_taxidentificati_detlocvat', line: i }),
                        base: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_base_detlocvat', line: i }),
                        amount: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_amount_detlocvat', line: i }),
                        amountFCP: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_fcpamount_detlocvat', line: i }),
                        exemptAmount: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_exemptbasisamou_detlocvat', line: i }),
                        othersBasisAmount: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_othersbasisamou_detlocvat', line: i }),
                        exemptionICMS: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_exemptionicms_detlocvat', line: i }),
                        addresseShareICMS: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_icmsaddresssha_detlocvat', line: i }),
                        shipperShareICMS: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_icmshippershare_detlocvat', line: i }),
                        itemNo: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_itemno_detlocvat', line: i }),
                        itemText: headerloc.getSublistText({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_itemno_detlocvat', line: i }),
                        perc: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_tax_detlocvat', line: i }),
                        brLineDiscAmount: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_brlinediscounta_detlocvat', line: i }),
                        sourceType: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_sourcetype_detlocvat', line: i }),
                        documentType: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_documenttype_detailloc', line: i }),
                        documentDate: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_docdate_detlocvat', line: i }),
                        branchCode: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_branchcode_detlocvat', line: i }),
                        fiscalBenefitCode: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_fiscbenefcode_detlocvat', line: i }),
                        percDeclaratory: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_declaratoryperc_detlocvat', line: i }),
                        difPerc: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_percentdifferen_detlocvat', line: i }),
                        amountTaxCalc: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_amounttaxcalc_detlocvat', line: i }),
                        itemType: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_itemtype_detlocvat', line: i }),
                        itemChargeType: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_itemchargetype_detlocvat', line: i }),
                        invoiceLineType: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_invoicelinetype_detlocvat', line: i }),
                        ncmCode: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_ncmcode_detlocvat', line: i }),
                        genBusPostingGroup: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_genbuspostinggr_detlocvat', line: i }),
                        reductionFactor: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_reductionfactor_detlocvat', line: i }),
                        relationChargeItemLineNo: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_relationchargei_detlocvat', line: i }),
                        lineQuantity: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat', fieldId: 'custrecord_mts_linequantity_detlocvat', line: i })
                     });

                  }
                  return detaillocList;
               })(),

               linelocList: (function () {
                  var lines = headerloc.getLineCount({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat' }) || 0;
                  var linelocList = [];

                  for (var i = 0; i < lines; i++) {
                     linelocList.push({
                        amtwithinclude: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_amtwithinclude_linelocvat', line: i }),
                        item: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_itemno_linelocvat', line: i }),
                        unitofmeasure: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_unitofmeasurec_linelocvat', line: i }),
                        description: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_description_linelocvat', line: i }),
                        lineNo: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_lineno_linelocvat', line: i }),
                        relationchargeitemlineno: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_relchaitemline_linelocvat', line: i }),
                        totalAmount: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_totalamount_linelocvat', line: i }),
                        brLineDiscAmount: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_totalamount_linelocvat', line: i }),
                        totalAmountDisconted: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_totalamtdisc_linelocvat', line: i }),
                        cfopCode: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_cfopcode_linelocvat', line: i }),
                        revenueTypeNFST: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_nfstrevenuetyp_linelocvat', line: i }),
                        classificationItemNFST: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_nfstclassfitem_linelocvat', line: i }),
                        itemType: headerloc.getSublistValue({ sublistId: 'recmachcustrecord_mts_headerlocvat_linelocvat', fieldId: 'custrecord_mts_type_linelocvat', line: i }),
                     });
                  }
                  return linelocList;
               })(),
            };
         }
         log.debug({ title: 'onMap', details: 'end createTransacObj - statisticBr:' + JSON.stringify(new Date) });

         var spedFiscalSetupObj = getSpedFiscalSetup();
         var spedContributionSetupObj = getSpedContributionSetup();

         return {
            transacBodyFields: transacBodyFields,
            transacSubListFields: transactionSublistFields,
            headerLocBodyFields: headerLocBodyFields,
            headerlocSublistFields: headerlocSublistFields,
            transactionId: transacRec.id,
            transactionType: transacRec.type,
            spedFiscalSetup: spedFiscalSetupObj,
            spedContributionSetupObj: spedContributionSetupObj
         }
      }
      function funcAuxFillFields() {
         return {

            getFieldPerTax: function (headerloc, taxIdentName, field) {
               var taxIdentNumberFilter = getNumberOfTax(taxIdentName);

               //filtrando campo com o mesmo imposto e somando
               var value = 0;

               var lineNumber = headerloc.findSublistLineWithValue({
                  sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat',
                  fieldId: 'custrecord_mts_taxidentificati_detlocvat',
                  value: taxIdentNumberFilter
               });

               if (lineNumber >= 0) {
                  value = headerloc.getSublistValue({
                     sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat',
                     fieldId: field,
                     line: lineNumber
                  });
               }

               return value
            },

            getOperationType: function (operationTypeId) {
               if (!operationTypeId)
                  return {};

               var operationTypeLookup = search.lookupFields({
                  type: 'customrecord_mts_opsetup',
                  id: operationTypeId,
                  columns: [
                     'internalid',
                     'custrecord_mts_cust_vend_entry_opsetup',
                     'custrecord_mts_item_entry_opsetup',
                     'custrecord_mts_transficmsamount_opsetup'
                  ]
               });

               return {
                  id: operationTypeLookup.internalid,
                  custvendEntry: operationTypeLookup.custrecord_mts_cust_vend_entry_opsetup,
                  itemEntry: operationTypeLookup.custrecord_mts_item_entry_opsetup,
                  transficmsamount: operationTypeLookup.custrecord_mts_transficmsamount_opsetup
               }
            },

            getPaymentMethod: function (paymentMethodId) {
               if (!paymentMethodId)
                  return {};

               var paymentMethodLookup = search.lookupFields({
                  type: 'customrecord_mts_paymethod',
                  id: paymentMethodId,
                  columns: [
                     'internalid',
                     'name',
                     'custrecord_mts_crtitletype_paymenthod'
                  ]
               });

               return {
                  id: paymentMethodLookup.internalid,
                  name: paymentMethodLookup.name,
                  creditTitleType: paymentMethodLookup.custrecord_mts_crtitletype_paymenthod
               }
            },

            getTerm: function (termId) {
               if (!termId)
                  return {};

               var termLookup = search.lookupFields({
                  type: 'term',
                  id: termId,
                  columns: [
                     'name',
                     'daysuntilnetdue'
                  ]
               });

               return {
                  name: termLookup.name,
                  daysUntilNetDue: termLookup.daysuntilnetdue
               }
            },

            getEntity: function (transacRec) {
               var entityId = '';

               if (transacRec.type == 'customsale_mts_transferinvoice_tr'){
                  transferOrderObj = this.getCreatedFromObj(transacRec);
                     
                  entityId = transferOrderObj.customerId;
               }else if (transacRec.type == 'itemreceipt'){
                  transferOrderObj = this.getCreatedFromObj(transacRec);
                     
                  entityId = transferOrderObj.vendorId;
               }else{
                  entityId = transacRec.getValue({ fieldId: 'entity' });
               }

               var entityType = '';
               if (["invoice", "creditmemo", "cashsale", "customsale_mts_transferinvoice_tr"].indexOf(transacRec.type) >= 0) // vendas
                  entityType = 'customer';
               else    // compras
                  entityType = 'vendor';

               if (!entityId || !entityType)
                  return {};

               var entityRec = record.load({
                  type: entityType,
                  id: entityId,
               });

               var entityName;

               var isPerson = entityRec.getValue({ fieldId: 'isperson' })
               if (isPerson == 'T') {
                  entityName = entityRec.getValue({ fieldId: 'firstname' });
                  entityName += ' ' + entityRec.getValue({ fieldId: 'middlename' });
                  entityName += ' ' + entityRec.getValue({ fieldId: 'lastname' });

               } else {
                  entityName = entityRec.getValue({ fieldId: 'companyname' });
               }

               var countriesObj = getAddressObj(entityRec)

               var muniDipamCode = "";

               if (countriesObj.ibgeCityCode) {
                  search.create({
                     type: "customrecord_mts_ibgecode",
                     filters: [
                        ["idtext", "is", countriesObj.ibgeCityCode]
                     ],
                     columns: [
                        "custrecord_mts_municipdipamcode_ibgecode"
                     ]
                  }).run().each(function (result) {
                     muniDipamCode = result.getValue({ name: "custrecord_mts_municipdipamcode_ibgecode" });
                  });
               }

               return {
                  id: entityRec.id,
                  type: entityType,
                  nameorig: entityRec.getValue({ fieldId: 'nameorig' }),
                  name: entityName,
                  category: entityRec.getValue({ fieldId: 'custentity_mts_categoryloc' }),
                  cpfOrCnpj: entityRec.getValue({ fieldId: 'custentity_mts_cnpjcpf' }),
                  ie: entityRec.getValue({ fieldId: 'custentity_mts_ie' }),
                  indicatorIeAddressee: entityRec.getValue({ fieldId: 'custentity_mts_indicatorie' }),
                  address: countriesObj.address,
                  zipCode: countriesObj.zipCode,
                  city: countriesObj.city,
                  state: countriesObj.state,
                  country: countriesObj.country,
                  countryDescription: countriesObj.countryDescription,
                  bacenCountryCode: countriesObj.bacenCountryCode,
                  ibgeCityCode: countriesObj.ibgeCityCode,
                  muniDipamCode: muniDipamCode,
                  address2: countriesObj.address2,
                  number: countriesObj.number,
                  district: countriesObj.district,
                  suframa: entityRec.getValue({ fieldId: 'custentity_mts_suframacode' }),
                  natureRetEntSource: entityRec.getValue({ fieldId: 'custentity_mts_natureretentsource' })
               }
            },

            getNFeProcess: function (nfeProcessId) {
               if (!nfeProcessId)
                  return {};

               var nfeProcessLookup = search.lookupFields({
                  type: 'customrecord_mts_eletiteminvproc',
                  id: nfeProcessId,
                  columns: [
                     'internalid',
                     'custrecord_mts_nfekeyace_eletiteminvproc',
                     'custrecord_mts_invreason_eletiteminvproc',
                     'custrecord_mts_retcode_eletiteminvproc'
                  ]
               });

               var returnCode = nfeProcessLookup.custrecord_mts_retcode_eletiteminvproc.length > 0 ? nfeProcessLookup.custrecord_mts_retcode_eletiteminvproc[0].value : '';
               var returnCodeObj = returnCode ? getReturnCode(returnCode) : {};

               return {
                  id: nfeProcessLookup.internalid[0].value,
                  nfeKeyAccess: nfeProcessLookup.custrecord_mts_nfekeyace_eletiteminvproc,
                  invoiceReason: nfeProcessLookup.custrecord_mts_invreason_eletiteminvproc.length > 0 ? nfeProcessLookup.custrecord_mts_invreason_eletiteminvproc[0].text.substr(0, 1) : '',
                  returnCodeObj: returnCodeObj,
               }
            },

            getBranch: function (branchCodeId) {
               var branchObj = {};

               if (!branchCodeId)
                  return branchObj;

               var lookupFieldBranchCode = search.lookupFields({
                  type: 'customrecord_mts_branchinfo',
                  id: branchCodeId,
                  columns: [
                     'name',
                     'internalid',
                     'custrecord_mts_cnpj_branchinfo',
                     'custrecord_mts_territorycode_branchinfo',
                     'custrecord_mts_ibgecitycode_branchinfo',
                     'custrecord_mts_ie_branchinfo',
                     'custrecord_mts_ccm_branchinfo',
                     'custrecord_mts_activitytype_branchinfo',
                     'custrecord_mts_postcode_branchinfo',
                     'custrecord_mts_number_branchinfo',
                     'custrecord_mts_complement_branchinfo',
                     'custrecord_mts_district_branchinfo',
                     'custrecord_mts_phoneno_branchinfo',
                     'custrecord_mts_faxno_branchinfo',
                     'custrecord_mts_email_branchinfo',
                     'custrecord_mts_indicatorofthe_branchinfo',
                     'custrecord_mts_nfeimporttype_branchinfo'
                  ]
               });

               branchObj.id = lookupFieldBranchCode.internalid[0].value;
               branchObj.name = lookupFieldBranchCode.name;
               branchObj.cnpj = lookupFieldBranchCode.custrecord_mts_cnpj_branchinfo;

               branchObj.nfeImportType = '';
               if (lookupFieldBranchCode.custrecord_mts_nfeimporttype_branchinfo.length)
                  branchObj.nfeImportType = lookupFieldBranchCode.custrecord_mts_nfeimporttype_branchinfo[0].value;

               branchObj.territoryCode = '';
               if (lookupFieldBranchCode.custrecord_mts_territorycode_branchinfo.length)
                  branchObj.territoryCode = getTerritory(lookupFieldBranchCode.custrecord_mts_territorycode_branchinfo[0].value);

               branchObj.ibgeCityCode = lookupFieldBranchCode.custrecord_mts_ibgecitycode_branchinfo;
               branchObj.ie = lookupFieldBranchCode.custrecord_mts_ie_branchinfo;
               branchObj.ccm = lookupFieldBranchCode.custrecord_mts_ccm_branchinfo;
               branchObj.activityType = lookupFieldBranchCode.custrecord_mts_activitytype_branchinfo;
               branchObj.postcode = lookupFieldBranchCode.custrecord_mts_postcode_branchinfo;
               branchObj.number = lookupFieldBranchCode.custrecord_mts_number_branchinfo;
               branchObj.complement = lookupFieldBranchCode.custrecord_mts_complement_branchinfo;
               branchObj.district = lookupFieldBranchCode.custrecord_mts_district_branchinfo;
               branchObj.phoneNo = lookupFieldBranchCode.custrecord_mts_phoneno_branchinfo;
               branchObj.faxNo = lookupFieldBranchCode.custrecord_mts_faxno_branchinfo;
               branchObj.email = lookupFieldBranchCode.custrecord_mts_email_branchinfo;
               branchObj.indicatorOfTheLegal = lookupFieldBranchCode.custrecord_mts_indicatorofthe_branchinfo;

               return branchObj;
            },

            sumFieldsOfSublistHeaderLoc: function (headerloc, sublist, field) {
               var lines = headerloc.getLineCount({ sublistId: sublist });
               var value = 0;

               for (var i = 0; i < lines; i++) {
                  value += headerloc.getSublistValue({
                     sublistId: sublist,
                     fieldId: field,
                     line: i
                  });
               }

               return value;
            },

            sumFieldsOfDetailLoc_FilteringTaxIdent: function (headerloc, field, taxIdentNameFilter) {
               var taxIdentNumberFilter = getNumberOfTax(taxIdentNameFilter);

               //filtrando campo com o mesmo imposto e somando
               var lines = headerloc.getLineCount({ sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat' });
               var value = 0;

               for (var i = 0; i < lines; i++) {
                  var taxIdentDetailLoc = headerloc.getSublistValue({
                     sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat',
                     fieldId: 'custrecord_mts_taxidentificati_detlocvat',
                     line: i
                  });

                  if (taxIdentDetailLoc == taxIdentNumberFilter)
                     value += headerloc.getSublistValue({
                        sublistId: 'recmachcustrecord_mts_headerlocvat_detlocvat',
                        fieldId: field,
                        line: i
                     });
               }

               return value;
            },

            getCreatedFromObj: function (transacRec) {
               const transactionType = {};
               transactionType["Transfer Order"] = 'transferorder';
               transactionType["Transferir pedido"] = 'transferorder';

               var createdFromType = '';
               if(transacRec.type == 'customsale_mts_transferinvoice_tr'){
                  var createdFromId = transacRec.getValue({fieldId: 'custbody_mts_createdform_invtr'});
                  var createdFromText = transacRec.getText({fieldId: 'custbody_mts_createdform_invtr'});
               }else{
                  var createdFromId = transacRec.getValue({fieldId: 'createdfrom'});
                  var createdFromText = transacRec.getText({fieldId: 'createdfrom'});
               }
               
               var createdFromTextList = createdFromText.split('#');
               if (createdFromTextList.length){
                  createdFromType = transactionType[createdFromTextList[0].trim()] || '';
               }

               if (!createdFromId || !createdFromType)
                  return {};

               if (createdFromType == 'transferorder'){
                  var createdFromLookup = search.lookupFields({
                     type: createdFromType,
                     id: createdFromId,
                     columns: [
                        'custbody_mts_customer_transferorder',
                        'custbody_mts_vendor_transferorder'
                     ]
                  });

                  var objAux = {};
                  objAux.customerId = '';
                  if(createdFromLookup.custbody_mts_customer_transferorder.length){
                     objAux.customerId = createdFromLookup.custbody_mts_customer_transferorder[0].value                     
                  }
                  objAux.vendorId = '';
                  if(createdFromLookup.custbody_mts_vendor_transferorder.length){
                     objAux.vendorId = createdFromLookup.custbody_mts_vendor_transferorder[0].value                     
                  }
                  
                  return objAux;
               }


            }
         }
      }
      function getReturnCode(returnCodeId) {
         if (!returnCodeId)
            return {};

         var nfeProcessLookup = search.lookupFields({
            type: 'customrecord_mts_returncode',
            id: returnCodeId,
            columns: [
               'name',
               'custrecord_mts_bookobservati_returncode',
            ]
         });

         return {
            id: returnCodeId,
            code: nfeProcessLookup.name,
            bookObservation: nfeProcessLookup.custrecord_mts_bookobservati_returncode,
         }
      }
      function getSpedFiscalSetup() {
         try {
            var lookupFieldSpedFiscSetup = search.lookupFields({
               type: 'customrecord_mts_spedfset',
               id: 1,
               columns: [
                  'custrecord_mts_profapres_spedfset',
                  'custrecord_mts_genblk228_spedfset'
               ]
            });

            var profileApresentation = lookupFieldSpedFiscSetup.custrecord_mts_profapres_spedfset;
            
            return {
               profileApresentation: profileApresentation.length ? profileApresentation[0].text.substr(0, 1) : '',
               generateBlockK200AndK280: lookupFieldSpedFiscSetup.custrecord_mts_genblk228_spedfset
            }

         } catch (e) {
            return {};
         }
      }
      function getSpedContributionSetup() {
         var spedContrSetup = {     // LocBr20.02
            profileApresentation: '',
            generateF100: false,
            taxIncidenceCode: '',
            generate1300And1700: false,
            calculationBasis: ''
         }

         var lookupFieldSpedFiscSetup = search.lookupFields({
            type: 'customrecord_mts_spedpiscosetup',
            id: 1,
            columns: [
               'custrecord_mts_profaprese_spedpiscosetup',
               'custrecord_mts_gnrtf100_spedpiscosetup',
               'custrecord_mts_taxinciden_spedpiscosetup',
               'custrecord_mts_genblock_spedpiscosetup',
               'custrecord_mts_calcbase_spedpiscosetup'
            ]
         });

         var profileApresentation = lookupFieldSpedFiscSetup.custrecord_mts_profaprese_spedpiscosetup;
         var taxIncidenceCode = lookupFieldSpedFiscSetup.custrecord_mts_taxinciden_spedpiscosetup;
         var calculationBasis = lookupFieldSpedFiscSetup.custrecord_mts_calcbase_spedpiscosetup;

         if (Object.keys(lookupFieldSpedFiscSetup).length){ // LocBr20.02
            spedContrSetup.profileApresentation = profileApresentation.length ? profileApresentation[0].text.substr(0, 1) : '';
            spedContrSetup.generateF100 = lookupFieldSpedFiscSetup.custrecord_mts_gnrtf100_spedpiscosetup;
            spedContrSetup.taxIncidenceCode = taxIncidenceCode.length ? taxIncidenceCode[0].text.substr(0, 1) : '';
            spedContrSetup.generate1300And1700 = lookupFieldSpedFiscSetup.custrecord_mts_genblock_spedpiscosetup;
            spedContrSetup.calculationBasis = calculationBasis.length ? calculationBasis[0].text.substr(0, 1) : '';
         }

         return spedContrSetup;     // LocBr20.02
      }
      function getFiscDocTypeFields(fiscDocTypeId) {
         var fiscalDocType = {};

         if (!fiscDocTypeId)
            return fiscalDocType;

         var lookupFieldFiscDocType = search.lookupFields({
            type: 'customrecord_mts_fiscaldoctype',
            id: fiscDocTypeId,
            columns: [
               'custrecord_mts_elecfilecod_fiscaldoctype',
               'internalid',
               'custrecord_mts_shiptodocty_fiscaldoctype',
               'custrecord_mts_separetenfe_fiscaldoctype',
               'custrecord_mts_notsubject_fiscaldoctype',
               'custrecord_mts_especie_fiscaldoctype',
               'name',
               'custrecord_mts_typenfthree_fiscaldoctype',
               'custrecord_mts_efdblocks_fiscaldoctype',
               'custrecord_mts_nfeshelf_fiscaldoctype'
            ]
         });
         fiscalDocType.id = lookupFieldFiscDocType.internalid[0].value;
         fiscalDocType.elecfilecod = lookupFieldFiscDocType.custrecord_mts_elecfilecod_fiscaldoctype;
         fiscalDocType.specie = lookupFieldFiscDocType.custrecord_mts_especie_fiscaldoctype;
         fiscalDocType.name = lookupFieldFiscDocType.name;
         fiscalDocType.isNFeShelf = lookupFieldFiscDocType.custrecord_mts_nfeshelf_fiscaldoctype;
         fiscalDocType.shiptodocty = '';
         if (lookupFieldFiscDocType.custrecord_mts_shiptodocty_fiscaldoctype.length > 0)
            fiscalDocType.shiptodocty = lookupFieldFiscDocType.custrecord_mts_shiptodocty_fiscaldoctype[0].text.substr(0, 1) || '';
         fiscalDocType.separatenfe = lookupFieldFiscDocType.custrecord_mts_separetenfe_fiscaldoctype;
         fiscalDocType.notsubjecticms = lookupFieldFiscDocType.custrecord_mts_notsubject_fiscaldoctype;
         if (lookupFieldFiscDocType.custrecord_mts_typenfthree_fiscaldoctype.length > 0)
            fiscalDocType.typeNf3e = lookupFieldFiscDocType.custrecord_mts_typenfthree_fiscaldoctype[0].text.substr(0, 1) || '';
         if (lookupFieldFiscDocType.custrecord_mts_efdblocks_fiscaldoctype.length > 0)
            fiscalDocType.efdBlocks = lookupFieldFiscDocType.custrecord_mts_efdblocks_fiscaldoctype[0].value || '';

         return fiscalDocType;
      }
      function getReturnCodeObj(returnCodeId) {
         var returnCodeObj = {};

         if (!returnCodeId)
            return returnCodeObj;

         var returnCodeLookup = search.lookupFields({
            type: 'customrecord_mts_returncode',
            id: returnCodeId,
            columns: [
               'custrecord_mts_negativereturn_returncode',
               'internalid',
               'name'
            ]
         });
         returnCodeObj.id = returnCodeLookup.internalid[0].value;
         returnCodeObj.isNegativeReturn = returnCodeLookup.custrecord_mts_negativereturn_returncode;
         returnCodeObj.code = returnCodeLookup.name;

         return returnCodeObj;
      }
      function getTerritory(territoryId) {
         if (!territoryId)
            return {};

         var territoryLookup = search.lookupFields({
            type: 'customrecord_mts_territories',
            id: territoryId,
            columns: [
               'internalid',
               'name',
            ]
         });

         return {
            id: territoryLookup.internalid[0].value,
            name: territoryLookup.name
         }
      }
      function getNumberOfTax(taxIdentName) {
         var taxIdentNumber = '';
         switch (taxIdentName) {
            case 'ICMS':
               taxIdentNumber = 2;
               break;
            case 'ST':
               taxIdentNumber = 15;
               break;
            case 'IPI':
               taxIdentNumber = 1;
               break;
            case 'PIS':
               taxIdentNumber = 3;
               break;
            case 'COFINS':
               taxIdentNumber = 4;
               break;
            case 'ISS':
               taxIdentNumber = 8;
               break;
            case 'PIS Ret.':
               taxIdentNumber = 10;
               break;
            case 'COFINS Ret.':
               taxIdentNumber = 11;
               break;
            case 'CSRF':
               taxIdentNumber = 22;
               break;
            default:
               return '';
         }
         return taxIdentNumber;
      }
      function sumLastCode(lastCode) {
         var widthTotal = lastCode.length;
         var code = '';
         var codeString = lastCode.substr(1);
         for (var index = 0; index < codeString.length; index++) {
            if (codeString[index] > 0) {
               code = codeString.substr(index);
               break;
            }
         };
         code = Number(code)
         if (code)
            code++;
         else
            code = 1;

         code = String(code);
         var codeLength = widthTotal - code.length;
         lastCode = lastCode.substring(0, codeLength) + code;
         lastCode = String(lastCode);

         if (lastCode.substr(0, 1) == 'A')
            lastAddInvTextCode = lastCode;

         if (lastCode.substr(0, 1) == 'O')
            lastObsFiscalCode = lastCode;

         return lastCode;
      }
      function getAddressObj(recordLoad) {
         var sublistAddrLine = recordLoad.findSublistLineWithValue({
            sublistId: 'addressbook',
            fieldId: 'defaultbilling',
            value: 'T'
         });
         
         var addrObj = {
            address: '',
            bacenCountryCode: '',
            ibgeCityCode: '',
            address2: '',
            number: '',
            district: '',
            zipCode: '',
            city: '',
            state: '',
            countryDescription: ''
         }
         
         if (sublistAddrLine > -1) {
         
            var addressSubrecord = recordLoad.getSublistSubrecord({
               sublistId: 'addressbook',
               fieldId: 'addressbookaddress',
               line: sublistAddrLine
            });
         
            if (addressSubrecord) {
               addrObj.address = addressSubrecord.getText({ fieldId: 'addr1' });
               addrObj.ibgeCityCode = addressSubrecord.getValue({ fieldId: 'custrecord_mts_ibgecitycode' });
               addrObj.address2 = addressSubrecord.getValue({ fieldId: 'custrecord_mts_complement' });
               addrObj.number = addressSubrecord.getValue({ fieldId: 'custrecord_mts_number' });
               addrObj.district = addressSubrecord.getValue({ fieldId: 'custrecord_mtsdistrict' });
               addrObj.zipCode = addressSubrecord.getValue({ fieldId: 'zip' }).replace(/-/g, '');
               addrObj.city = addressSubrecord.getValue({ fieldId: 'city' });
               addrObj.state = addressSubrecord.getValue({ fieldId: 'state' });
               addrObj.country = addressSubrecord.getValue({ fieldId: 'country' });
         
               var countriesSearch = search.create({
                  type: "customrecord_mts_countries",
                  filters: [
                     ['idtext', 'is', addrObj.country]
                  ],
                  columns:
                     [
                        "altname",
                        "custrecord_mts_bacencountry_countries",
                     ]
               });
               
               countriesSearch.run().each(function (result) {
                  addrObj.bacenCountryCode = result.getValue({ name: 'custrecord_mts_bacencountry_countries' })
                  addrObj.countryDescription = result.getValue({ name: 'altname' })
                  return false;
               });
               
            }
         }

         return addrObj;
      }
      function getBillingAddress(transacRec) {
         if (["customsale_mts_transferinvoice_tr", "itemreceipt"].indexOf(transacRec.type) >= 0){
            return {};
         }
         
         var billAddrObj = {};
         var billAddrSubRec = transacRec.getSubrecord({ fieldId: 'billingaddress' });

         billAddrObj.address = billAddrSubRec.getValue({ fieldId: 'addr1' });
         billAddrObj.number = billAddrSubRec.getValue({ fieldId: 'custrecord_mts_number' }).substr(0, 10).trim(); // LocBr20.04
         billAddrObj.complement = billAddrSubRec.getValue({ fieldId: 'custrecord_mts_complement' });
         billAddrObj.district = billAddrSubRec.getValue({ fieldId: 'custrecord_mtsdistrict' });
         billAddrObj.zipCode = billAddrSubRec.getValue({ fieldId: 'zip' }).replace(/-/g, '');
         billAddrObj.ibgecityCode = billAddrSubRec.getValue({ fieldId: 'custrecord_mts_ibgecitycode' });
         billAddrObj.city = billAddrSubRec.getValue({ fieldId: 'city' });
         billAddrObj.state = billAddrSubRec.getValue({ fieldId: 'state' });
         billAddrObj.country = billAddrSubRec.getValue({ fieldId: 'country' });

         // get country informations
         var countryList = getCountries(['idtext', 'is', billAddrObj.country]);
         billAddrObj.countryDescription = countryList.length ? countryList[0].name : '';
         billAddrObj.countryBacenCode = countryList.length ? countryList[0].bacenCode : '';

         return billAddrObj;
      }
      function getCountries(lvfilters) {
         var objAux = {};
         var objList = [];

         var countriesSearch = search.create({
            type: "customrecord_mts_countries",
            filters: lvfilters,
            columns:
               [
                  "internalid",
                  "altname",
                  "custrecord_mts_bacencountry_countries"
               ]
         });

         if (countriesSearch.runPaged().count) {
            countriesSearch.run().each(function (result) {
               objAux = {};
               objAux.id = result.getValue({ name: 'internalid' });
               objAux.name = result.getValue({ name: 'altname' });
               objAux.bacenCode = result.getValue({ name: 'custrecord_mts_bacencountry_countries' });// BACEN Country Code

               objList.push(objAux);
               return true;
            });
         }

         return objList;
      }
      function getItemPerType(itemType, itemId, transacBodyFields) {
         if (!itemId)
            return {};


         var itemRec = {};
         var description = '';
         var accountNo = '';
         var serviceExecutedAbroad = false;
         var codeBaseCalcCredit = '';
         var revenueType = '';
         var classificationItem = '';
         var feedItemObj = {};

         // find item in buffer list
         var feedItemResult = Buffer.itemList.filter(function (item) {
            return (item.type == itemType && item.id == itemId)
         });
         if (feedItemResult.length)
            feedItemObj = feedItemResult[0];


         switch (itemType) {
            case 'InvtPart':
               // itemRec = record.load({
               //     type: 'inventoryitem',
               //     id: itemId,
               // });
               if (transacBodyFields.fiscalType == 1) { //compras
                  description = getItemDescription(feedItemObj, 'purchaseDescription', 'salesDescription');
                  accountNo = feedItemObj.assetAccount;
                  // accountNo = itemRec.getValue({ fieldId: 'assetaccount' });
               } else { //vendas
                  description = getItemDescription(feedItemObj, 'salesDescription', 'purchaseDescription');
                  accountNo = feedItemObj.incomeAccount;
                  // accountNo = itemRec.getValue({ fieldId: 'incomeaccount' });
               }

               break;

            // case 'OthCharge':
            //     itemRec = record.load({
            //         type: 'otherchargeitem',
            //         id: itemId,
            //     });
            //     break;

            case 'Service':
               // itemRec = record.load({
               //     type: 'serviceitem',
               //     id: itemId,
               // });

               // var subtype = itemRec.getValue({ fieldId: 'subtype' });
               var subtype = feedItemObj.subType;

               if (subtype == 'Purchase') {
                  description = getItemDescription(feedItemObj, 'purchaseDescription', 'salesDescription');
                  accountNo = feedItemObj.expenseAccount;
                  // accountNo = itemRec.getValue({ fieldId: 'expenseaccount' });

               } else if (subtype == 'Sale') {
                  description = getItemDescription(feedItemObj, 'salesDescription', 'purchaseDescription');
                  accountNo = feedItemObj.incomeAccount;
                  // accountNo = itemRec.getValue({ fieldId: 'incomeaccount' });

               } else {
                  description = getItemDescription(feedItemObj, 'purchaseDescription', 'salesDescription');
                  accountNo = feedItemObj.expenseAccount;
                  // accountNo = itemRec.getValue({ fieldId: 'expenseaccount' });
               }

               serviceExecutedAbroad = feedItemObj.isExecutedServiceAbroad;
               codeBaseCalcCredit = feedItemObj.creditCalculationBaseCode;
               revenueType = feedItemObj.revenueType;
               classificationItem = feedItemObj.classItemText;
               // serviceExecutedAbroad = itemRec.getValue({ fieldId: 'custitem_mts_serviceexecut' });
               // codeBaseCalcCredit = itemRec.getValue({ fieldId: 'custitem_mts_codebasecalc' });
               // revenueType = itemRec.getValue({ fieldId: 'custitem_mts_nfstrevenuetype' });
               // classificationItem = itemRec.getText({ fieldId: 'custitem_mts_nfstclassificationitem' });
               break;

            case 'NonInvtPart':
               // itemRec = record.load({
               //     type: 'noninventoryitem',
               //     id: itemId,
               // });

               var subtype = feedItemObj.subType;
               // var subtype = itemRec.getValue({ fieldId: 'subtype' });

               if (subtype == 'Purchase') {
                  description = getItemDescription(feedItemObj, 'purchaseDescription', 'salesDescription');
                  accountNo = feedItemObj.expenseAccount;
                  // accountNo = itemRec.getValue({ fieldId: 'expenseaccount' });
               } else if (subtype == 'Sale') {
                  description = getItemDescription(feedItemObj, 'salesDescription', 'purchaseDescription');
                  accountNo = feedItemObj.incomeAccount;
                  // accountNo = itemRec.getValue({ fieldId: 'incomeaccount' });
               } else {
                  description = getItemDescription(feedItemObj, 'purchaseDescription', 'salesDescription');
                  accountNo = feedItemObj.expenseAccount;
                  // accountNo = itemRec.getValue({ fieldId: 'expenseaccount' });
               }

               revenueType = feedItemObj.revenueType;
               classificationItem = feedItemObj.classItemText;
               // revenueType = itemRec.getValue({ fieldId: 'custitem_mts_nfstrevenuetype' });
               // classificationItem = itemRec.getText({ fieldId: 'custitem_mts_nfstclassificationitem' });
               break;

            default:
               return {};
         }

         var unitMeasureObj = {};
         if (itemType == 'InvtPart') {
            // find unit type for stock
            var unitsTypeFiltered = Buffer.unitTypeList.filter(function (unitType) {
               return (unitType.internalid == feedItemObj.unitsType && unitType.unitname == feedItemObj.stockUnitText)
            });
            if (unitsTypeFiltered.length) {
               var unitTypeStock = unitsTypeFiltered[0];
               unitMeasureObj = getUnitMeasureFromBuffer(unitTypeStock.abbreviation);
            }

            // old
            // stockunit = itemRec.getValue({ fieldId: 'stockunit' });

            // if (unitsType) {
            //     var unitMeasureRec = record.load({ type: 'unitstype', id: unitsType });
            //     var line = unitMeasureRec.findSublistLineWithValue({ sublistId: 'uom', fieldId: 'internalid', value: stockunit });
            //     var unitCode = unitMeasureRec.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: line });
            //     unitMeasureObj = getUnitMeasure(unitCode);
            // }
         } else {
            var unitsTypeFiltered = Buffer.unitTypeList.filter(function (unitType) {
               return (unitType.internalid == feedItemObj.unitsType && unitType.isbaseunit == true)
            });
            if (unitsTypeFiltered.length) {
               var unitTypeBase = unitsTypeFiltered[0];
               unitMeasureObj = getUnitMeasureFromBuffer(unitTypeBase.abbreviation);
            }
            // old
            // var baseunit = itemRec.getText({ fieldId: 'baseunit' });
            // unitMeasureObj = getUnitMeasure(baseunit);
         }

         // var productType = itemRec.getValue({ fieldId: 'custitem_mts_producttype' }) || '';
         // if (productType)
         //     productType = itemRec.getText({ fieldId: 'custitem_mts_producttype' });


         if (Object.keys(feedItemObj).length)
            return {
               id: feedItemObj.id,     //itemRec.id,
               type: feedItemObj.type,     //itemRec.type,
               itemId: feedItemObj.itemid,  //itemRec.getValue({ fieldId: 'itemid' }),
               name: feedItemObj.displayname,  //itemRec.getValue({ fieldId: 'displayname' }),
               genprodposgroup: feedItemObj.genProdPostingGroupText,  //itemRec.getText({ fieldId: 'custitem_mts_genprodposgroup_item' }),
               cestcode: feedItemObj.cestCode,       // itemRec.getValue({ fieldId: 'custitem_mts_cestcode' }) || '',
               federalservcode: feedItemObj.federalService,    // itemRec.getValue({ fieldId: 'custitem_mts_federalservic' }) || '',
               stockUnit: feedItemObj.stockUnit,   // ? itemRec.getText({ fieldId: 'stockunit' }) : '',
               baseUnit: feedItemObj.unitsTypeText,  //itemRec.getText({ fieldId: 'baseunit' }),
               unitMeasureObj: unitMeasureObj,
               ncmcode: feedItemObj.ncmCode,   //itemRec.getValue({ fieldId: 'custitem_mts_ncmcode' }),
               producttype: feedItemObj.productTypeText,
               icmsInternalSpedObj: getICMSinternalSPEDFromBuffer(transacBodyFields.branchCodeObj.territoryCode.id, itemRec.id),
               unitstype: feedItemObj.unitsType,  //itemRec.getValue({ fieldId: 'unitstype' }),
               description: description ? String(description).trim() : '',
               serviceExecutedAbroad: serviceExecutedAbroad,
               codeBaseCalcCredit: codeBaseCalcCredit,
               revenueType: revenueType,
               classificationItem: classificationItem ? classificationItem.substr(0, 4) : '',
               accountNo: getAccountNoFromBuffer(accountNo),
               itemChargeType: feedItemObj.itemChargeType//itemRec.getValue({ fieldId: 'custitem_mts_itemchargetype' }),
            };
         else
            return {}
      }
      function getItemDescription(feedItemObj, firstFieldOption, secondFieldOption) {
         var desc = '';

         desc = feedItemObj[firstFieldOption];

         if (!desc)
            desc = feedItemObj[secondFieldOption];

         return desc;

         // var desc = '';

         // desc = itemRec.getValue({ fieldId: firstFieldOption }) || '';

         // if (!desc)
         //     desc = itemRec.getValue({ fieldId: secondFieldOption }) || '';

         // return desc;
      }
      function getUnitMeasure(unitMeasureId) {
         if (!unitMeasureId)
            return {};

         var unitOfMeasureLocSearch = search.create({
            type: "customrecord_mts_uomloc",
            filters: [
               ['idText', 'is', unitMeasureId]
            ],
            columns:
               [
                  "internalid",
                  "custrecord_mts_efilescode_uomloc",
                  "custrecord_mts_fcicode_uomloc",
                  'altname'
               ]
         });

         var id, efilesCode, altname = '';
         var resultCount = unitOfMeasureLocSearch.runPaged().count;
         if (resultCount) {
            unitOfMeasureLocSearch.run().each(function (result) {
               id = result.getValue({ name: 'internalid' });
               efilesCode = result.getValue({ name: 'custrecord_mts_efilescode_uomloc' });
               altname = result.getValue({ name: 'altname' });

               return false;
            });
         }

         return {
            code: id,
            unitMeasureCode: efilesCode,
            description: altname
         }
      }
      function getUnitMeasureFromBuffer(unitMeasureName) {
         if (!unitMeasureName)
            return {};

         var unitOfMeaFiltered = Buffer.unitMeasureList.filter(function (unitofmeasure) {
            return (unitofmeasure.name.toUpperCase() == unitMeasureName.toUpperCase())
         });
         if (unitOfMeaFiltered.length) {
            return unitOfMeaFiltered[0];
         } else {
            return {};
         }
      }
      function getICMSinternalSPED(branchTerritory, itemId) {
         var icmsPerc = 0;

         if (branchTerritory) {
            var searchICMSInternal = search.create({
               type: 'customrecord_mts_internalicmssped',
               filters: [
                  ['custrecord_mts_itemno_internalicmssped', 'is', itemId],
                  'AND',
                  ['custrecord_mts_territor_internalicmssped', 'is', branchTerritory]
               ],
               columns: [
                  'custrecord_mts_tax_internalicmssped'
               ]
            })
            var resultCount = searchICMSInternal.runPaged().count;
            if (resultCount) {
               searchICMSInternal.run().each(function (result) {
                  icmsPerc = result.getValue({ name: 'custrecord_mts_tax_internalicmssped' })
                  return false;
               });
            }
         }
         return icmsPerc;
      }
      function getICMSinternalSPEDFromBuffer(branchTerritory, itemId) {
         if (!branchTerritory || !itemId)
            return 0;

         var internalICMSSPEDFiltered = Buffer.internalICMSSPEDList.filter(function (internalICMS) {
            return (internalICMS.itemId == itemId);
         });
         if (internalICMSSPEDFiltered.length) {
            return internalICMSSPEDFiltered[0].taxPerc;
         }
      }
      function getDocumentReference(docRefType, docRefId) {
         docRefObj = {};

         if (!docRefType || !docRefId)
            return docRefObj;

         var tranLookup = search.lookupFields({
            type: docRefType,
            id: docRefId,
            columns: [
               'trandate',
               'entity',
               'custbody_mts_externaldocno',
               'custbody_mts_printserie',
               'custbody_mts_itemnfeprocess'
            ]
         });

         docRefObj.type = docRefType;
         docRefObj.id = docRefId;
         docRefObj.tranDate = tranLookup.trandate;
         if (tranLookup.entity.length) {
            docRefObj.entityId = tranLookup.entity[0].value;
            docRefObj.entityTxt = tranLookup.entity[0].text;
         }
         docRefObj.externalDocumentNo = tranLookup.custbody_mts_externaldocno;
         docRefObj.printSerie = tranLookup.custbody_mts_printserie;
         docRefObj.printSubSerie = tranLookup.custbody_mts_printsubserie;

         docRefObj.eletrInvObj = {
            id: '',
            nfeKeyAccess: ''
         };
         if (tranLookup.custbody_mts_itemnfeprocess.length) {
            docRefObj.eletrInvObj.id = tranLookup.custbody_mts_itemnfeprocess[0].value;

            var eletrInvLookup = search.lookupFields({
               type: 'customrecord_mts_eletiteminvproc',
               id: docRefObj.eletrInvObj.id,
               columns: [
                  'custrecord_mts_nfekeyace_eletiteminvproc'
               ]
            });

            docRefObj.eletrInvObj.nfeKeyAccess = eletrInvLookup.custrecord_mts_nfekeyace_eletiteminvproc;
         }

         return docRefObj;
      }
      function feedBufferLists(transactionRec) {
         var collectIDsObj = collectIDsToFilter(transactionRec);

         feedBufferItemList(collectIDsObj);
         feedBufferUnitsTypeList(collectIDsObj);
         feedBufferUnitMeasureLocList();
         feedBufferAccountList(collectIDsObj);
         feedBufferICMSinternalSPEDList(collectIDsObj);
      }
      function collectIDsToFilter(transactionRec) {
         var collectIDsObj = {
            itemsRefObj: {
               types: [],
               ids: []
            },
            unitsTypeRefList: [],
            accountsRefList: [],
            branchTerritoryId: 0
         }

         //header
         if (Buffer.internalICMSSPEDList.length) {
            var branchId = transactionRec.getValue({ fieldId: 'custbody_mts_branchcode' });
            if (branchId) {
               var branchInfoLookup = search.lookupFields({
                  type: 'customrecord_mts_branchinfo',
                  id: branchId,
                  columns: [
                     'custrecord_mts_territorycode_branchinfo'
                  ]
               });

               if (branchInfoLookup.custrecord_mts_territorycode_branchinfo.length) {
                  collectIDsObj.branchTerritoryId = branchInfoLookup.custrecord_mts_territorycode_branchinfo[0].value || 0;
               }
            }
         }


         // lines
         var lines = transactionRec.getLineCount({ sublistId: 'item' });
         for (var i = 0; i < lines; i++) {
            // Items
            var itemType = transactionRec.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
            var itemId = transactionRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });

            var idx = collectIDsObj.itemsRefObj.types.map(function (elem) {
               return (elem == itemType)
            }).indexOf(true);
            if (idx == -1)
               collectIDsObj.itemsRefObj.types.push(itemType);

            var idx = collectIDsObj.itemsRefObj.ids.map(function (elem) {
               return (elem == itemId)
            }).indexOf(true);
            if (idx == -1)
               collectIDsObj.itemsRefObj.ids.push(itemId);
         }

         return collectIDsObj;

      }
      function feedBufferItemList(collectIDsObj) {

         search.create({
            type: 'item',
            filters: [
               ["type", "anyof", collectIDsObj.itemsRefObj.types],
               "AND",
               ["internalid", "anyof", collectIDsObj.itemsRefObj.ids]
            ],
            columns: [
               // default columns
               'type',
               'internalid',
               'purchasedescription',
               'salesdescription',
               'displayname',
               'itemid',
               'unitstype',        // baseunit
               'custitem_mts_producttype',
               'custitem_mts_genprodposgroup_item',
               'custitem_mts_cestcode',
               'custitem_mts_federalservic',
               'stockunit',
               'incomeaccount',
               'custitem_mts_ncmcode',
               // inventory columns
               'assetaccount',
               // service columns
               'subtype',
               'expenseaccount',
               'custitem_mts_serviceexecut',
               'custitem_mts_codebasecalc',
               'custitem_mts_nfstrevenuetype',
               'custitem_mts_nfstclassificationitem',
               'custitem_mts_itemchargetype'
            ]
         }).run().each(function (result) {
            var itemObj = {};
            itemObj.type = result.getValue({ name: 'type' });
            itemObj.id = result.getValue({ name: 'internalid' });
            itemObj.purchaseDescription = result.getValue({ name: 'purchasedescription' });
            itemObj.salesDescription = result.getValue({ name: 'salesdescription' });
            itemObj.displayname = result.getValue({ name: 'displayname' });
            itemObj.itemid = result.getValue({ name: 'itemid' });

            var itemIdList = itemObj.itemid.split(':');
            if (itemIdList.length == 2) {
               itemObj.itemid = itemIdList[1].trim();
            }

            itemObj.unitsType = result.getValue({ name: 'unitstype' });        // baseuni;
            itemObj.unitsTypeText = result.getText({ name: 'unitstype' });        // baseuni;
            itemObj.productType = result.getValue({ name: 'custitem_mts_producttype' });
            itemObj.productTypeText = result.getText({ name: 'custitem_mts_producttype' });
            itemObj.genProdPostingGroup = result.getValue({ name: 'custitem_mts_genprodposgroup_item' });
            itemObj.genProdPostingGroupText = result.getText({ name: 'custitem_mts_genprodposgroup_item' });
            itemObj.cestCode = result.getValue({ name: 'custitem_mts_cestcode' });
            itemObj.federalService = result.getValue({ name: 'custitem_mts_federalservic' });
            itemObj.ncmCode = result.getValue({ name: 'custitem_mts_ncmcode' });
            itemObj.stockUnit = result.getValue({ name: 'stockunit' });
            itemObj.stockUnitText = result.getText({ name: 'stockunit' });
            itemObj.incomeAccount = result.getValue({ name: 'incomeaccount' });
            itemObj.assetAccount = result.getValue({ name: 'assetaccount' });
            itemObj.subType = result.getValue({ name: 'subtype' });
            itemObj.expenseAccount = result.getValue({ name: 'expenseaccount' });
            itemObj.isExecutedServiceAbroad = result.getValue({ name: 'custitem_mts_serviceexecut' });
            itemObj.creditCalculationBaseCode = result.getValue({ name: 'custitem_mts_codebasecalc' });
            itemObj.revenueType = result.getValue({ name: 'custitem_mts_nfstrevenuetype' });
            itemObj.classItem = result.getValue({ name: 'custitem_mts_nfstclassificationitem' });
            itemObj.classItemText = result.getText({ name: 'custitem_mts_nfstclassificationitem' });
            itemObj.itemChargeType = result.getValue({ name: 'custitem_mts_itemchargetype' });

            Buffer.itemList.push(itemObj);

            // save ids for feed
            if (itemObj.unitsType)
               collectIDsObj.unitsTypeRefList.push(itemObj.unitsType);

            if (itemObj.incomeAccount)
               collectIDsObj.accountsRefList.push(itemObj.incomeAccount);

            if (itemObj.assetAccount)
               collectIDsObj.accountsRefList.push(itemObj.assetAccount);

            if (itemObj.expenseAccount)
               collectIDsObj.accountsRefList.push(itemObj.expenseAccount);

            return true;
         });
      }
      function feedBufferUnitMeasureLocList() {
         if (Buffer.unitMeasureList.length)
            return;

         var unitOfMeasureLocSearch = search.create({
            type: "customrecord_mts_uomloc",
            filters: [],     //filters,
            columns:
               [
                  "name",
                  "internalid",
                  "custrecord_mts_efilescode_uomloc",
                  "altname"
               ]
         });

         unitOfMeasureLocSearch.run().each(function (result) {
            Buffer.unitMeasureList.push({
               name: result.getValue({ name: 'name' }),
               code: result.getValue({ name: 'internalid' }),
               unitMeasureCode: result.getValue({ name: 'custrecord_mts_efilescode_uomloc' }),
               description: result.getValue({ name: 'altname' })
            });

            return true;
         });

      }
      function feedBufferUnitsTypeList(collectIDsObj) {
         if (!collectIDsObj.unitsTypeRefList.length)
            return;

         var unitstypeSearchObj = search.create({
            type: "unitstype",
            filters:
               [
                  ["internalid", "anyof", collectIDsObj.unitsTypeRefList]
               ],
            columns:
               [
                  "internalid",
                  "abbreviation",
                  "pluralabbreviation",
                  "baseunit",
                  "unitname",
                  "pluralname"
               ]
         });

         unitstypeSearchObj.run().each(function (result) {
            var unitsTypeObj = {}
            unitsTypeObj.internalid = result.getValue({ name: 'internalid' });
            unitsTypeObj.abbreviation = result.getValue({ name: 'abbreviation' });
            unitsTypeObj.pluralabbreviation = result.getValue({ name: 'pluralabbreviation' });
            unitsTypeObj.unitname = result.getValue({ name: 'unitname' });
            unitsTypeObj.pluralname = result.getValue({ name: 'pluralname' });
            unitsTypeObj.isbaseunit = result.getValue({ name: 'baseunit' });

            Buffer.unitTypeList.push(unitsTypeObj);

            return true;
         });
      }
      function feedBufferAccountList(collectIDsObj) {
         if (!collectIDsObj.accountsRefList.length)
            return;

         var accountSearchObj = search.create({
            type: "account",
            filters:
               [
                  ["internalid", "anyof", collectIDsObj.accountsRefList]
               ],
            columns:
               [
                  "internalid",
                  "number",
                  "name",
                  "custrecord_mts_localno_account"
               ]
         });

         accountSearchObj.run().each(function (result) {
            var accObj = {}
            accObj.internalid = result.getValue({ name: 'internalid' });
            accObj.number = result.getValue({ name: 'number' });
            accObj.name = result.getValue({ name: 'name' });
            accObj.localNo = result.getValue({ name: 'custrecord_mts_localno_account' });

            accObj.name = String(accObj.name).replace(accObj.number, '').trim();

            Buffer.accountList.push(accObj);

            return true;
         });
      }
      function feedBufferICMSinternalSPEDList(collectIDsObj) {
         if (!collectIDsObj.branchTerritoryId)
            return;

         var internalICMSSPEDSearchObj = search.create({
            type: "customrecord_mts_internalicmssped",
            filters:
               [
                  ['custrecord_mts_territor_internalicmssped', 'is', collectIDsObj.branchTerritoryId]
               ],
            columns:
               [
                  "internalid",
                  "custrecord_mts_itemno_internalicmssped",
                  "custrecord_mts_tax_internalicmssped"
               ]
         });

         internalICMSSPEDSearchObj.run().each(function (result) {
            var intICMSSPEDObj = {};
            intICMSSPEDObj.internalid = result.getValue({ name: 'internalid' });
            intICMSSPEDObj.itemId = result.getValue({ name: 'custrecord_mts_itemno_internalicmssped' });
            intICMSSPEDObj.taxPerc = result.getValue({ name: 'custrecord_mts_tax_internalicmssped' });

            Buffer.internalICMSSPEDList.push(intICMSSPEDObj);

            return true;
         });
      }

      //Reduce Structure
      function functionBlock() {
         return {

            objBlock: {
               transactionId: '',
               Block0: {},
               BlockA: {},
               BlockB: {},
               BlockC: {},
               BlockD: {},
               BlockE: {},
               BlockF: {},
               BlockI: {},
               BlockG: {},
               BlockH: {},
               BlockK: {},
               BlockM: {},
               Block1: {},
               Block9: {},
               PercentAbstractObj: {},
               StateAbstractObj: {},
               CFOPAbstractList: []
            },

            Block0: function (transactionObj) {

               this.objBlock.Block0._0150Obj = {};
               this.objBlock.Block0._0190List = [];
               this.objBlock.Block0._0200List = [];
               this.objBlock.Block0._0400List = [];
               this.objBlock.Block0._0500List = [];
               this.objBlock.Block0._0600Obj = {};

               if (transactionObj && Object.keys(transactionObj).length) {
               } else {
                  return {};
               }
            },

            BlockA: function (transactionObj, taxSettlementRec) {

               this.objBlock.BlockA._a100Obj = {};

               if (transactionObj && Object.keys(transactionObj).length) {

                  var generateERPPisCofins = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });
                  if (transactionObj.transacBodyFields.fiscalType == 1 && transactionObj.headerlocSublistFields.totalloc.sum_PIS_Amount == 0 && generateERPPisCofins)
                     return {};

                  this.objBlock.BlockA._a100Obj.docdate = transactionObj.transacBodyFields.docDate;
                  this.objBlock.BlockA._a100Obj.fiscaltype = transactionObj.transacBodyFields.fiscalType || '';
                  this.objBlock.BlockA._a100Obj.shiptodoc = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.shiptodocty : '';
                  this.objBlock.BlockA._a100Obj.fiscalmodelcod = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
                  this.objBlock.BlockA._a100Obj.taxsituation = checkTaxSituation(transactionObj);
                  this.objBlock.BlockA._a100Obj.tranId = transactionObj.transactionId;
                  this.objBlock.BlockA._a100Obj.seriesub = transactionObj.transacBodyFields.printSerie + transactionObj.transacBodyFields.printSubSerie || '';
                  this.objBlock.BlockA._a100Obj.einvkey = getNFeKeyAccess(transactionObj);
                  this.objBlock.BlockA._a100Obj.docno = transactionObj.transacBodyFields.externalDocNo || '';
                  this.objBlock.BlockA._a100Obj.docdate = transactionObj.transacBodyFields.docDate;
                  this.objBlock.BlockA._a100Obj.postdate = transactionObj.transacBodyFields.date;
                  this.objBlock.BlockA._a100Obj.glamount = transactionObj.headerLocBodyFields.totalAmountDiscount;
                  this.objBlock.BlockA._a100Obj.brdiscount = transactionObj.headerLocBodyFields.totalDiscountAmount;
                  this.objBlock.BlockA._a100Obj.documenttype = transactionObj.transactionType;
                  this.objBlock.BlockA._a100Obj.notsubjecticms = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.notsubjecticms : false;
                  this.objBlock.BlockA._a100Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                  this.objBlock.BlockA._a100Obj.billtopayto = transactionObj.transacBodyFields.getEntityCode();     //.entityObj.id;

                  if (Object.keys(transactionObj.transacBodyFields.operationTypeObj).length && !transactionObj.transacBodyFields.operationTypeObj.custvendEntry && transactionObj.transacBodyFields.fiscalShipment) {
                     this.objBlock.BlockA._a100Obj.paymenttype = '2';     // outros
                  } else {
                     if (transactionObj.transacBodyFields.termObj.daysUntilNetDue == 0) {
                        this.objBlock.BlockA._a100Obj.paymenttype = '0';     // a prazo
                     } else {
                        this.objBlock.BlockA._a100Obj.paymenttype = '1';     // a prazo
                     }
                  }

                  this.objBlock.BlockA._a100Obj.cofinsret = transactionObj.headerlocSublistFields.totalloc.sum_COFINSRet_Amount;
                  this.objBlock.BlockA._a100Obj.pisret = transactionObj.headerlocSublistFields.totalloc.sum_PISRet_Amount;
                  this.objBlock.BlockA._a100Obj.iss = transactionObj.headerlocSublistFields.totalloc.sum_ISS_Amount;
                  this.objBlock.BlockA._a100Obj.pisbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_PIS_BasisAmount;
                  this.objBlock.BlockA._a100Obj.cofinsbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_COFINS_BasisAmount;
                  this.objBlock.BlockA._a100Obj.pisamount = transactionObj.headerlocSublistFields.totalloc.sum_PIS_Amount;
                  this.objBlock.BlockA._a100Obj.cofinsamount = transactionObj.headerlocSublistFields.totalloc.sum_COFINS_Amount;
                  this.objBlock.BlockA._a100Obj.territoryCode = transactionObj.transacBodyFields.territory.id;



                  //A120
                  var serviceExecutedAbroadIndex = transactionObj.transacSubListFields.itemList.map(function (elem) {
                     return (elem.itemObj.type == 'serviceitem' && elem.itemObj.serviceExecutedAbroad == true)
                  }).indexOf(true);

                  this.objBlock.BlockA._a100Obj.serviceExecutedAbroad = serviceExecutedAbroadIndex >= 0 ? true : false;


                  var taxSituation = checkTaxSituation(transactionObj)

                  this.objBlock.BlockA._a100Obj._a110List = taxSituation != '02' ? fill_A110List(transactionObj) : [];
                  this.objBlock.BlockA._a100Obj._a170List = taxSituation != '02' ? fill_A170List.call(this, transactionObj, taxSettlementRec) : [];

                  this.objBlock.Block0._0150Obj = fill_0150Obj(transactionObj, taxSettlementRec);

               } else {
                  return {};
               }
            },

            BlockB: function (transactionObj) {
               if (transactionObj && Object.keys(transactionObj).length) {
               } else {
                  return {};
               }
            },

            BlockC: function (transactionObj, taxSettlementRec) {

               this.objBlock.BlockC._c100Obj = {};
               this.objBlock.BlockC._c500Obj = {};

               if (transactionObj && Object.keys(transactionObj).length) {

                  var fiscalModelCode = transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod;
                  var generateERPPisCofins = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });

                  if (transactionObj.transacBodyFields.fiscalType == 1 && transactionObj.headerlocSublistFields.totalloc.sum_PIS_Amount == 0 && generateERPPisCofins)
                     return {};

                  if ((fiscalModelCode == '01' || fiscalModelCode == '1B' || fiscalModelCode == '04' || fiscalModelCode == '55' || fiscalModelCode == '65')) {
                     if (!generateERPPisCofins || !(transactionObj.transacBodyFields.fiscalType == 1 && transactionObj.headerlocSublistFields.totalloc.sum_PIS_Amount == 0)) {

                        this.objBlock.BlockC._c100Obj.tranId = transactionObj.transactionId;
                        this.objBlock.BlockC._c100Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                        this.objBlock.BlockC._c100Obj.fiscaltype = transactionObj.transacBodyFields.fiscalType || '';
                        this.objBlock.BlockC._c100Obj.fiscalmodelcod = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
                        this.objBlock.BlockC._c100Obj.shiptodoc = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.shiptodocty : '';
                        this.objBlock.BlockC._c100Obj.taxsituation = checkTaxSituation(transactionObj);
                        this.objBlock.BlockC._c100Obj.seriesub = transactionObj.transacBodyFields.printSerie + transactionObj.transacBodyFields.printSubSerie || '';
                        this.objBlock.BlockC._c100Obj.docno = transactionObj.transacBodyFields.externalDocNo || '';
                        this.objBlock.BlockC._c100Obj.einvkey = getNFeKeyAccess(transactionObj);
                        this.objBlock.BlockC._c100Obj.docdate = transactionObj.transacBodyFields.docDate;
                        this.objBlock.BlockC._c100Obj.postdate = transactionObj.transacBodyFields.date;
                        this.objBlock.BlockC._c100Obj.glamount = transactionObj.headerLocBodyFields.totalAmountDiscount;

                        if (Object.keys(transactionObj.transacBodyFields.operationTypeObj).length && !transactionObj.transacBodyFields.operationTypeObj.custvendEntry && transactionObj.transacBodyFields.fiscalShipment) {
                           this.objBlock.BlockC._c100Obj.paymenttype = '2';     // outros
                        } else {
                           if (transactionObj.transacBodyFields.termObj.daysUntilNetDue == 0) {
                              this.objBlock.BlockC._c100Obj.paymenttype = '0';     // a prazo
                           } else {
                              this.objBlock.BlockC._c100Obj.paymenttype = '1';     // a prazo
                           }
                        }

                        var freightAmount = getFreightAmount(transactionObj) || 0;
                        var insuranceAmount = getInsuranceAmount(transactionObj) || 0;
                        var otherdispanamt = getOtherExpensesAmount(transactionObj) || 0;

                        this.objBlock.BlockC._c100Obj.otherdispanamt = otherdispanamt;
                        this.objBlock.BlockC._c100Obj.freightamount = freightAmount;
                        this.objBlock.BlockC._c100Obj.insuranceamount = insuranceAmount;
                        this.objBlock.BlockC._c100Obj.lineamount = getLineAmount(transactionObj, freightAmount, insuranceAmount, otherdispanamt);


                        this.objBlock.BlockC._c100Obj.brdiscount = transactionObj.headerLocBodyFields.totalDiscountAmount;
                        this.objBlock.BlockC._c100Obj.exemptionicms = transactionObj.headerlocSublistFields.totalloc.sum_ExemptionICMS;
                        var detailList = transactionObj.headerlocSublistFields.detaillocList.filter(function (result) {
                           return (result.cfopCode != '' && result.cfopCode != 0)
                        });
                        this.objBlock.BlockC._c100Obj.cfopcode = detailList.length > 0 ? detailList[0].cfopCode : '';
                        this.objBlock.BlockC._c100Obj.cfopdescription = detailList.length > 0 ? detailList[0].cfopDesc : '';
                        this.objBlock.BlockC._c100Obj.icmsperc = transactionObj.headerlocSublistFields.totalloc.perc_ICMS;
                        this.objBlock.BlockC._c100Obj.ipiothersbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_IPI_OtherBasisAmount;
                        this.objBlock.BlockC._c100Obj.freightbillet = transactionObj.transacBodyFields.freightBilledTo ? transactionObj.transacBodyFields.freightBilledTo.substr(0, 1) : '';
                        this.objBlock.BlockC._c100Obj.icmsbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_BasisAmount;
                        this.objBlock.BlockC._c100Obj.icmsamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_Amount;
                        this.objBlock.BlockC._c100Obj.icmsexemptamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_ExemptAmount;
                        this.objBlock.BlockC._c100Obj.icmsothersbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_OtherBasisAmount;
                        this.objBlock.BlockC._c100Obj.glamount3 = transactionObj.headerLocBodyFields.totalAmountDiscount;
                        this.objBlock.BlockC._c100Obj.amountfcp = transactionObj.headerlocSublistFields.totalloc.sum_AmountFCP;
                        this.objBlock.BlockC._c100Obj.amticmsuf = transactionObj.headerlocSublistFields.totalloc.sum_AddresseeShareICMS;
                        this.objBlock.BlockC._c100Obj.amounticmsuf = transactionObj.headerlocSublistFields.totalloc.sum_ShipperShareICMS;
                        var creditTitleObj = getCreditTitleType(transactionObj);
                        this.objBlock.BlockC._c100Obj.credittitletyp = creditTitleObj.type;
                        this.objBlock.BlockC._c100Obj.complcredtitle = creditTitleObj.description;
                        this.objBlock.BlockC._c100Obj.numberofplots = transactionObj.transacBodyFields.qtyInstallments;
                        this.objBlock.BlockC._c100Obj.billtopaytoName = transactionObj.transacBodyFields.entityObj.name;
                        this.objBlock.BlockC._c100Obj.cnpj = transactionObj.transacBodyFields.entityObj.cpfOrCnpj;
                        this.objBlock.BlockC._c100Obj.ie = transactionObj.transacBodyFields.entityObj.ie;
                        this.objBlock.BlockC._c100Obj.territorycode = transactionObj.transacBodyFields.territory.id; //territoryCode;
                        this.objBlock.BlockC._c100Obj.pisbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_PIS_BasisAmount;
                        this.objBlock.BlockC._c100Obj.cofinsbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_COFINS_BasisAmount;
                        this.objBlock.BlockC._c100Obj.cofinsret = transactionObj.headerlocSublistFields.totalloc.sum_COFINSRet_Amount;
                        this.objBlock.BlockC._c100Obj.pisret = transactionObj.headerlocSublistFields.totalloc.sum_PISRet_Amount;
                        this.objBlock.BlockC._c100Obj.iss = transactionObj.headerlocSublistFields.totalloc.sum_ISS_Amount;
                        this.objBlock.BlockC._c100Obj.ipibasisamount = transactionObj.headerlocSublistFields.totalloc.sum_IPI_BasisAmount;
                        this.objBlock.BlockC._c100Obj.ipiexemptamount = transactionObj.headerlocSublistFields.totalloc.sum_IPI_ExemptAmount;
                        this.objBlock.BlockC._c100Obj.ipiothersbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_IPI_OtherBasisAmount;
                        this.objBlock.BlockC._c100Obj.fiscaldoctype = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.id : '';
                        this.objBlock.BlockC._c100Obj.documenttype = transactionObj.transactionType;
                        this.objBlock.BlockC._c100Obj.csrf = transactionObj.headerlocSublistFields.totalloc.sum_CSRF_Amount;
                        this.objBlock.BlockC._c100Obj.amounticmsufdest = transactionObj.headerlocSublistFields.totalloc.sum_AddresseeShareICMS;
                        this.objBlock.BlockC._c100Obj.amounticmsufrem = transactionObj.headerlocSublistFields.totalloc.sum_ShipperShareICMS;
                        this.objBlock.BlockC._c100Obj.notsubjecticms = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.notsubjecticms : false;
                        this.objBlock.BlockC._c100Obj.transportShipToType = transactionObj.transacBodyFields.shipmentAdviceType ? transactionObj.transacBodyFields.shipmentAdviceType.substr(0, 2) : '';

                        if (fiscalModelCode != '65') {
                           this.objBlock.BlockC._c100Obj.billtopayto = transactionObj.transacBodyFields.getEntityCode(); //.entityObj.id;
                           this.objBlock.BlockC._c100Obj.icmsstbasis = transactionObj.headerlocSublistFields.totalloc.sum_ST_ICMSbasisAmount;
                           this.objBlock.BlockC._c100Obj.icmsstamount = transactionObj.headerlocSublistFields.totalloc.sum_ST_ICMSamount;
                           this.objBlock.BlockC._c100Obj.ipiamount = transactionObj.headerlocSublistFields.totalloc.sum_IPI_Amount;
                           this.objBlock.BlockC._c100Obj.pisamount = transactionObj.headerlocSublistFields.totalloc.sum_PIS_Amount;
                           this.objBlock.BlockC._c100Obj.cofinsamount = transactionObj.headerlocSublistFields.totalloc.sum_COFINS_Amount;
                           this.objBlock.BlockC._c100Obj.glamount1 = getGlamountOneAndTwo('COFINS Ret.', transactionObj);
                           this.objBlock.BlockC._c100Obj.glamount2 = getGlamountOneAndTwo('PIS Ret.', transactionObj);

                           this.objBlock.Block0._0150Obj = fill_0150Obj(transactionObj, taxSettlementRec);

                        } else {
                           this.objBlock.BlockC._c100Obj.billtopayto = '';
                           this.objBlock.BlockC._c100Obj.icmsstbasis = '';
                           this.objBlock.BlockC._c100Obj.icmsstamount = '';
                           this.objBlock.BlockC._c100Obj.ipiamount = '';
                           this.objBlock.BlockC._c100Obj.pisamount = '';
                           this.objBlock.BlockC._c100Obj.cofinsamount = '';
                           this.objBlock.BlockC._c100Obj.glamount1 = '';
                           this.objBlock.BlockC._c100Obj.glamount2 = '';
                        }

                        if (Object.keys(transactionObj.transacBodyFields.operationTypeObj).length)
                           this.objBlock.BlockC._c100Obj.itemmov = transactionObj.transacBodyFields.operationTypeObj.itemEntry;
                        else
                           this.objBlock.BlockC._c100Obj.itemmov = true;


                        if (fiscalModelCode == '01' || fiscalModelCode == '04') {
                           this.objBlock.BlockC._c100Obj.transportedquant = transactionObj.transacBodyFields.transportedQuantity;
                           this.objBlock.BlockC._c100Obj.grossweight = 0;
                           this.objBlock.BlockC._c100Obj.netweight = 0;
                        }

                        var taxSituation = checkTaxSituation(transactionObj)
                        var taxSituationValidation = (taxSituation == '02' || taxSituation == '03' || taxSituation == '04' || taxSituation == '05');

                        var isSpedContribution = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });
                        if (isSpedContribution) {
                           this.objBlock.BlockC._c100Obj._c110List = !taxSituationValidation ? fill_C110List(transactionObj) : [];
                           this.objBlock.BlockC._c100Obj._c120List = !taxSituationValidation ? fill_C120List(transactionObj) : [];
                           this.objBlock.BlockC._c100Obj._c141List = [];
                           this.objBlock.BlockC._c100Obj._c170List = !taxSituationValidation ? fill_C170List.call(this, transactionObj, taxSettlementRec) : [];
                           this.objBlock.BlockC._c100Obj._c190List = [];
                           this.objBlock.BlockC._c100Obj._c195List = [];
                        } else {
                           this.objBlock.BlockC._c100Obj._c110List = !taxSituationValidation ? fill_C110List(transactionObj) : [];
                           this.objBlock.BlockC._c100Obj._c120List = !taxSituationValidation ? fill_C120List(transactionObj) : [];
                           this.objBlock.BlockC._c100Obj._c141List = !taxSituationValidation ? fill_C141List(transactionObj) : [];
                           this.objBlock.BlockC._c100Obj._c170List = !taxSituationValidation ? fill_C170List.call(this, transactionObj, taxSettlementRec) : [];
                           this.objBlock.BlockC._c100Obj._c190List = !taxSituationValidation ? fill_C190List(transactionObj) : [];
                           this.objBlock.BlockC._c100Obj._c195List = !taxSituationValidation ? fill_C195List(transactionObj) : [];
                        }

                     }
                  }
                  if ((fiscalModelCode == '06' || fiscalModelCode == '28' || fiscalModelCode == '66')) {
                     var fiscalType = transactionObj.transacBodyFields.fiscalType;

                     if (fiscalType == 1) {
                        this.objBlock.BlockC._c500Obj.tranId = transactionObj.transactionId;
                        this.objBlock.BlockC._c500Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                        this.objBlock.BlockC._c500Obj.fiscaltype = transactionObj.transacBodyFields.fiscalType;
                        this.objBlock.BlockC._c500Obj.fiscalmodelcod = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
                        this.objBlock.BlockC._c500Obj.taxsituation = checkTaxSituation(transactionObj);
                        this.objBlock.BlockC._c500Obj.billtopayto = transactionObj.transacBodyFields.getEntityCode();   //.entityObj.id;
                        this.objBlock.BlockC._c500Obj.billtopaytoName = transactionObj.transacBodyFields.entityObj.name;
                        this.objBlock.BlockC._c500Obj.seriesub = transactionObj.transacBodyFields.printSerie; // + transactionObj.transacBodyFields.printSubSerie;
                        this.objBlock.BlockC._c500Obj.docno = transactionObj.transacBodyFields.externalDocNo;
                        this.objBlock.BlockC._c500Obj.docdate = transactionObj.transacBodyFields.docDate;
                        this.objBlock.BlockC._c500Obj.postdate = transactionObj.transacBodyFields.date;
                        this.objBlock.BlockC._c500Obj.glamount = transactionObj.headerLocBodyFields.totalAmountDiscount;
                        this.objBlock.BlockC._c500Obj.einvkey = getNFeKeyAccess(transactionObj);
                        this.objBlock.BlockC._c500Obj.indicatorIeAddressee = transactionObj.transacBodyFields.entityObj.indicatorIeAddressee;
                        this.objBlock.BlockC._c500Obj.ibgecitycode = transactionObj.transacBodyFields.entityObj.ibgeCityCode;
                        this.objBlock.BlockC._c500Obj.accountno = transactionObj.transacSubListFields.itemList[0].itemObj.accountNo.localNo;
                        this.objBlock.BlockC._c500Obj.typeNf3e = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.typeNf3e : '';
                        this.objBlock.BlockC._c500Obj.pisamount = transactionObj.headerlocSublistFields.totalloc.sum_PIS_Amount;
                        this.objBlock.BlockC._c500Obj.cofinsamount = transactionObj.headerlocSublistFields.totalloc.sum_COFINS_Amount;
                        this.objBlock.BlockC._c500Obj.hashSubDoc = transactionObj.transacBodyFields.hashSubDoc;
                        this.objBlock.BlockC._c500Obj.injectedEnergy = transactionObj.transacSubListFields.itemList[0].injectedEnergy;
                        this.objBlock.BlockC._c500Obj.otherDeductions = transactionObj.transacSubListFields.itemList[0].otherDeductions;
                        this.objBlock.BlockC._c500Obj.nfeKeyAccessThirdIssue = getThirdNFeKeyAccess(transactionObj);
                        

                        var detailList = transactionObj.headerlocSublistFields.detaillocList.filter(function (result) {
                           return (result.cfopCode != '' && result.cfopCode != 0)
                        });
                        this.objBlock.BlockC._c500Obj.cfopcode = detailList.length > 0 ? detailList[0].cfopCode : '';
                        this.objBlock.BlockC._c500Obj.icmsperc = transactionObj.headerlocSublistFields.totalloc.perc_ICMS;
                        this.objBlock.Block0._0150Obj = fill_0150Obj(transactionObj, taxSettlementRec);

                        var isSpedContribution = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });
                        if (isSpedContribution) {
                           var taxCalculation = checkTaxSituation(transactionObj);
                           this.objBlock.BlockC._c500Obj._c501List = taxCalculation != 2 ? fill_C501List.call(this, transactionObj) : [];
                           this.objBlock.BlockC._c500Obj._c505List = taxCalculation != 2 ? fill_C505List.call(this, transactionObj) : [];
                           this.objBlock.BlockC._c500Obj._c590List = [];

                           fill_0500List(transactionObj.transacSubListFields.itemList[0].itemObj.accountNo.localNo, this.objBlock.Block0._0500List);
                        } else {
                           this.objBlock.BlockC._c500Obj._c501List = []
                           this.objBlock.BlockC._c500Obj._c505List = []
                           this.objBlock.BlockC._c500Obj._c590List = fill_C590List(transactionObj);
                        }
                     }
                  }
               } else {
                  return {};
               }
            },

            BlockD: function (transactionObj, taxSettlementRec) {

               this.objBlock.BlockD._d100Obj = {};
               this.objBlock.BlockD._d500Obj = {};
               this.objBlock.BlockD._d600Obj = {};
               this.objBlock.BlockD._d695Obj = {};

               if (transactionObj && Object.keys(transactionObj).length) {

                  var generateERPPisCofins = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });

                  if (transactionObj.transacBodyFields.fiscalType == 1 && transactionObj.headerlocSublistFields.totalloc.sum_PIS_Amount == 0 && generateERPPisCofins)
                     return {};

                  var fiscalModelCode = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
                  if ((fiscalModelCode == '07' || fiscalModelCode == '08' || fiscalModelCode == '8B' || fiscalModelCode == '09' || fiscalModelCode == '10' || fiscalModelCode == '11' ||
                     fiscalModelCode == '26' || fiscalModelCode == '27' || fiscalModelCode == '57' || fiscalModelCode == '63' || fiscalModelCode == '67')) {


                     this.objBlock.BlockD._d100Obj.tranId = transactionObj.transactionId;
                     this.objBlock.BlockD._d100Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                     this.objBlock.BlockD._d100Obj.fiscaltype = transactionObj.transacBodyFields.fiscalType;
                     this.objBlock.BlockD._d100Obj.fiscalmodelcod = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
                     this.objBlock.BlockD._d100Obj.shiptodoc = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.shiptodocty : '';
                     this.objBlock.BlockD._d100Obj.taxsituation = checkTaxSituation(transactionObj);
                     this.objBlock.BlockD._d100Obj.billtopayto = transactionObj.transacBodyFields.getEntityCode();      //.entityObj.id;
                     this.objBlock.BlockD._d100Obj.seriesub = transactionObj.transacBodyFields.printSerie, //+ transactionObj.transacBodyFields.printSubSerie;
                     this.objBlock.BlockD._d100Obj.docno = transactionObj.transacBodyFields.externalDocNo;
                     this.objBlock.BlockD._d100Obj.einvkey = getNFeKeyAccess(transactionObj);
                     this.objBlock.BlockD._d100Obj.docdate = transactionObj.transacBodyFields.docDate;
                     this.objBlock.BlockD._d100Obj.postdate = transactionObj.transacBodyFields.date;
                     this.objBlock.BlockD._d100Obj.glamount = transactionObj.headerLocBodyFields.totalAmountDiscount;
                     if (transactionObj.transacBodyFields.freightBilledTo)
                        this.objBlock.BlockD._d100Obj.freightbillet = transactionObj.transacBodyFields.freightBilledTo.substr(0, 1);
                     else
                        this.objBlock.BlockD._d100Obj.freightbillet = '';

                     this.objBlock.BlockD._d100Obj.icmsbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_BasisAmount;
                     this.objBlock.BlockD._d100Obj.icmsamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_Amount;
                     this.objBlock.BlockD._d100Obj.originibge = transactionObj.transacBodyFields.originIbgeCityCode;
                     this.objBlock.BlockD._d100Obj.destibgecity = transactionObj.transacBodyFields.destIbgeCityCode;
                     this.objBlock.BlockD._d100Obj.fiscaldoctype = transactionObj.transacBodyFields.fiscalDocTypeObj.id;
                     this.objBlock.BlockD._d100Obj.accountno = transactionObj.transacSubListFields.itemList[0].itemObj.accountNo.localNo;


                     var detailList = transactionObj.headerlocSublistFields.detaillocList.filter(function (result) {
                        return (result.cfopCode != '' && result.cfopCode != 0)
                     });
                     this.objBlock.BlockD._d100Obj.cfopcode = detailList.length > 0 ? detailList[0].cfopCode : '';
                     this.objBlock.BlockD._d100Obj.icmsperc = transactionObj.headerlocSublistFields.totalloc.perc_ICMS;


                     var isSpedContribution = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });
                     if (isSpedContribution) {
                        this.objBlock.BlockD._d100Obj._d101List = fill_D101List.call(this, transactionObj);
                        this.objBlock.BlockD._d100Obj._d105List = fill_D105List.call(this, transactionObj);
                        this.objBlock.BlockD._d100Obj._d110List = [];
                        this.objBlock.BlockD._d100Obj._d190List = [];
                        this.objBlock.BlockD._d100Obj._d195List = [];
                     } else {
                        this.objBlock.BlockD._d100Obj._d101List = [];
                        this.objBlock.BlockD._d100Obj._d105List = [];
                        this.objBlock.BlockD._d100Obj._d110List = fill_D110List.call(this, transactionObj, taxSettlementRec);
                        this.objBlock.BlockD._d100Obj._d190List = fill_D190List(transactionObj);
                        this.objBlock.BlockD._d100Obj._d195List = fill_D195List(transactionObj);
                     }

                     this.objBlock.Block0._0150Obj = fill_0150Obj(transactionObj, taxSettlementRec);

                  }

                  var isSpedContribution = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });

                  if ((fiscalModelCode == '21' || fiscalModelCode == '22') && !isSpedContribution) {

                     if (!transactionObj.transacBodyFields.masterDigitalAuthCode) {

                        this.objBlock.BlockD._d500Obj.tranId = transactionObj.transactionId;
                        this.objBlock.BlockD._d500Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                        this.objBlock.BlockD._d500Obj.fiscaltype = transactionObj.transacBodyFields.fiscalType;

                        this.objBlock.BlockD._d500Obj.fiscaldoctype = transactionObj.transacBodyFields.fiscalDocTypeObj.id;
                        this.objBlock.BlockD._d500Obj.fiscalmodelcod = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
                        this.objBlock.BlockD._d500Obj.shiptodoc = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.shiptodocty : '';
                        this.objBlock.BlockD._d500Obj.taxsituation = checkTaxSituation(transactionObj);
                        this.objBlock.BlockD._d500Obj.billtopayto = transactionObj.transacBodyFields.getEntityCode();      //.entityObj.id;
                        this.objBlock.BlockD._d500Obj.seriesub = transactionObj.transacBodyFields.printSerie, //+ transactionObj.transacBodyFields.printSubSerie;
                           this.objBlock.BlockD._d500Obj.docno = transactionObj.transacBodyFields.externalDocNo;
                        this.objBlock.BlockD._d500Obj.docdate = transactionObj.transacBodyFields.docDate;
                        this.objBlock.BlockD._d500Obj.postdate = transactionObj.transacBodyFields.date;
                        this.objBlock.BlockD._d500Obj.glamount = transactionObj.headerLocBodyFields.totalAmountDiscount;
                        this.objBlock.BlockD._d500Obj.icmsexemptamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_ExemptAmount;
                        this.objBlock.BlockD._d500Obj.icmsbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_BasisAmount;
                        this.objBlock.BlockD._d500Obj.icmsamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_Amount;
                        var detailList = transactionObj.headerlocSublistFields.detaillocList.filter(function (result) {
                           return (result.cfopCode != '' && result.cfopCode != 0)
                        });
                        this.objBlock.BlockD._d500Obj.cfopcode = detailList.length > 0 ? detailList[0].cfopCode : '';
                        this.objBlock.BlockD._d500Obj.icmsperc = transactionObj.headerlocSublistFields.totalloc.perc_ICMS;
                        this.objBlock.BlockD._d500Obj.accountno = transactionObj.transacSubListFields.itemList[0].itemObj.accountNo.localNo;


                        this.objBlock.BlockD._d500Obj._d501List = [];
                        this.objBlock.BlockD._d500Obj._d505List = [];
                        this.objBlock.BlockD._d500Obj._d590List = fill_D590List(transactionObj);

                        this.objBlock.Block0._0150Obj = fill_0150Obj(transactionObj, taxSettlementRec);

                     } else {

                        this.objBlock.BlockD._d695Obj.fiscalmodelcod = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
                        this.objBlock.BlockD._d695Obj.fiscaltype = transactionObj.transacBodyFields.fiscalType || '';
                        this.objBlock.BlockD._d695Obj.docno = transactionObj.transacBodyFields.externalDocNo;
                        this.objBlock.BlockD._d695Obj.docdate = transactionObj.transacBodyFields.docDate;
                        this.objBlock.BlockD._d695Obj.seriesub = transactionObj.transacBodyFields.printSerie, //+ transactionObj.transacBodyFields.printSubSerie;
                           this.objBlock.BlockD._d695Obj.nomeMaster = transactionObj.transacBodyFields.fileNameMaster;
                        this.objBlock.BlockD._d695Obj.masterDigitalAuthCode = transactionObj.transacBodyFields.masterDigitalAuthCode;

                        this.objBlock.BlockD._d695Obj._d696List = fill_D696List(transactionObj);
                     }

                  }

                  if ((fiscalModelCode == '21' || fiscalModelCode == '22') && isSpedContribution) {

                     if (transactionObj.transacBodyFields.fiscalType == 1) {

                        this.objBlock.BlockD._d500Obj.tranId = transactionObj.transactionId;
                        this.objBlock.BlockD._d500Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                        this.objBlock.BlockD._d500Obj.fiscaltype = transactionObj.transacBodyFields.fiscalType;
                        this.objBlock.BlockD._d500Obj.fiscaldoctype = transactionObj.transacBodyFields.fiscalDocTypeObj.id;
                        this.objBlock.BlockD._d500Obj.fiscalmodelcod = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
                        this.objBlock.BlockD._d500Obj.shiptodoc = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.shiptodocty : '';
                        this.objBlock.BlockD._d500Obj.taxsituation = checkTaxSituation(transactionObj);
                        this.objBlock.BlockD._d500Obj.billtopayto = transactionObj.transacBodyFields.getEntityCode();      //.entityObj.id;
                        this.objBlock.BlockD._d500Obj.seriesub = transactionObj.transacBodyFields.printSerie, //+ transactionObj.transacBodyFields.printSubSerie;
                           this.objBlock.BlockD._d500Obj.docno = transactionObj.transacBodyFields.externalDocNo;
                        this.objBlock.BlockD._d500Obj.docdate = transactionObj.transacBodyFields.docDate;
                        this.objBlock.BlockD._d500Obj.postdate = transactionObj.transacBodyFields.date;
                        this.objBlock.BlockD._d500Obj.glamount = transactionObj.headerLocBodyFields.totalAmountDiscount;
                        this.objBlock.BlockD._d500Obj.icmsexemptamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_ExemptAmount;
                        this.objBlock.BlockD._d500Obj.icmsbasisamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_BasisAmount;
                        this.objBlock.BlockD._d500Obj.icmsamount = transactionObj.headerlocSublistFields.totalloc.sum_ICMS_Amount;
                        var detailList = transactionObj.headerlocSublistFields.detaillocList.filter(function (result) {
                           return (result.cfopCode != '' && result.cfopCode != 0)
                        });
                        this.objBlock.BlockD._d500Obj.cfopcode = detailList.length > 0 ? detailList[0].cfopCode : '';
                        this.objBlock.BlockD._d500Obj.icmsperc = transactionObj.headerlocSublistFields.totalloc.perc_ICMS;
                        this.objBlock.BlockD._d500Obj.accountno = transactionObj.transacSubListFields.itemList[0].itemObj.accountNo.localNo;

                        this.objBlock.BlockD._d500Obj._d501List = fill_D501List.call(this, transactionObj);
                        this.objBlock.BlockD._d500Obj._d505List = fill_D505List.call(this, transactionObj);
                        this.objBlock.BlockD._d500Obj._d590List = [];

                        this.objBlock.Block0._0150Obj = fill_0150Obj(transactionObj, taxSettlementRec);

                     } else {

                        log.audit("CHEGO AQUI")

                        this.objBlock.BlockD._d600Obj.tranId = transactionObj.transactionId;
                        this.objBlock.BlockD._d600Obj.ibgecitycode = transactionObj.transacBodyFields.entityObj.ibgeCityCode;
                        this.objBlock.BlockD._d600Obj.fiscalmodelcod = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
                        this.objBlock.BlockD._d600Obj.fiscaltype = transactionObj.transacBodyFields.fiscalType || '';
                        this.objBlock.BlockD._d600Obj.docdate = transactionObj.transacBodyFields.docDate;
                        this.objBlock.BlockD._d600Obj.seriesub = transactionObj.transacBodyFields.printSerie, //+ transactionObj.transacBodyFields.printSubSerie;
                           this.objBlock.BlockD._d600Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                        this.objBlock.BlockD._d600Obj.fiscaldoctype = transactionObj.transacBodyFields.fiscalDocTypeObj.id;
                        this.objBlock.BlockD._d600Obj.icmsperc = transactionObj.headerlocSublistFields.totalloc.perc_ICMS;
                        this.objBlock.BlockD._d600Obj.glamount = transactionObj.headerLocBodyFields.totalAmountDiscount;

                        this.objBlock.BlockD._d600Obj.taxes = [];

                        var itemList = transactionObj.transacSubListFields.itemList;
                        for (var i = 0; i < itemList.length; i++) {
                           var taxes = {}
                           taxes.revenueType = itemList[i].itemObj.revenueType;

                           taxes.icmsotheramount = 0
                           taxes.icmsexemptamount = 0;
                           taxes.icmsbasisamount = 0;
                           taxes.icmsamount = 0;
                           taxes.pisamount = 0;
                           taxes.cofinsamount = 0;

                           var detaillocFilterItem = transactionObj.headerlocSublistFields.detaillocList.filter(function (detailLine) {
                              return (detailLine.itemNo == itemList[i].itemObj.id)
                           });

                           for (var i = 0; i < detaillocFilterItem.length; i++) {
                              var detailLine = detaillocFilterItem[i];

                              if (detailLine.taxIdent == 2) {
                                 taxes.icmsotheramount += detailLine.othersBasisAmount;
                                 taxes.icmsexemptamount += detailLine.exemptAmount;
                                 taxes.icmsbasisamount += detailLine.base;
                                 taxes.icmsamount += detailLine.amount;
                              }

                              if (detailLine.taxIdent == 3)
                                 taxes.pisamount += detailLine.amount;

                              if (detailLine.taxIdent == 4)
                                 taxes.cofinsamount += detailLine.amount;
                           }
                           this.objBlock.BlockD._d600Obj.taxes.push(taxes);
                        }


                        this.objBlock.BlockD._d600Obj._d601List = fill_D601List.call(this, transactionObj);
                        this.objBlock.BlockD._d600Obj._d605List = fill_D605List.call(this, transactionObj);
                     }
                  }
               } else {
                  return {};
               }
            },

            BlockE: function (transactionObj, taxSettlementRec) {
               this.objBlock.BlockE._e115List = [];
               this.objBlock.BlockE._e200Obj = {};
               this.objBlock.BlockE._e300Obj = {};
               this.objBlock.BlockE._e510List = {};

               if (transactionObj && Object.keys(transactionObj).length) {
                  if (!transactionObj.headerlocSublistFields)
                     return {};

                  var territoryCode = transactionObj.transacBodyFields.territory.id;
                  var branchCode = transactionObj.transacBodyFields.branchCodeObj;
                  var fiscalType = transactionObj.transacBodyFields.fiscalType;
                  var complementaryInv = transactionObj.transacBodyFields.compInvType;
                  var detaillocList = transactionObj.headerlocSublistFields.detaillocList;
                  var linelocList = transactionObj.headerlocSublistFields.linelocList;

                  var blockEObj = {
                     territoryCode: territoryCode,
                     branchCode: branchCode,
                     complementaryInv: complementaryInv,
                     fiscalType: fiscalType,
                     linelocList: linelocList,

                     _e115List: [],
                     _e200Obj: {
                        _e210List: []
                     },
                     _e300Obj: {
                        _e310List: []
                     },
                     _e510List: [],
                  };


                  for (var i = 0; i < detaillocList.length; i++) {

                     if (detaillocList[i].cfopCode && transactionObj.transacBodyFields.creditOrReturn != 2) { // nao cancelado

                        fill_E115List(detaillocList[i], blockEObj)

                        fill_E210List(detaillocList[i], blockEObj)

                        fill_E310List(detaillocList[i], blockEObj)

                        fill_E510List(detaillocList[i], blockEObj)
                     }
                  };

                  // var blockEObj = handling_BlockE(transactionObj,taxSettlementRec);

                  this.objBlock.BlockE._e115List = blockEObj._e115List;

                  this.objBlock.BlockE._e200Obj = blockEObj._e200Obj;
                  this.objBlock.BlockE._e300Obj = blockEObj._e300Obj;


                  var fiscalModelCode = transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod;
                  if ((fiscalModelCode == '01' || fiscalModelCode == '1B' || fiscalModelCode == '04' || fiscalModelCode == '55' || fiscalModelCode == '65'))
                     this.objBlock.BlockE._e510List = blockEObj._e510List;
               } else {
                  return {};
               }
            },

            BlockF: function (transactionObj, taxSettlementRec) {
               this.objBlock.BlockF._f100List = []
               this.objBlock.BlockF._f600List = []

               if (transactionObj && Object.keys(transactionObj).length) {
                  var generateERPPisCofins = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });
                  if (transactionObj.transacBodyFields.fiscalType == 1 && transactionObj.headerlocSublistFields.totalloc.sum_PIS_Amount == 0 && generateERPPisCofins)
                     return {};

                  if (
                     Object.keys(transactionObj.transacBodyFields.fiscalDocTypeObj).length &&
                     transactionObj.transacBodyFields.fiscalDocTypeObj.efdBlocks == 1
                  ) {
                     var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

                     for (var i = 0; i < detaillocPerItemList.length; i++) {

                        var f100Obj = {};
                        f100Obj.fiscalType = transactionObj.transacBodyFields.fiscalType;
                        f100Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                        f100Obj.docDate = transactionObj.transacBodyFields.docDate;
                        f100Obj.entity = '';

                        if (Object.keys(transactionObj.transacBodyFields.entityObj).length)
                           f100Obj.entity = transactionObj.transacBodyFields.getEntityCode();      //.entityObj.id;

                        var cfopcode = detaillocPerItemList[i].cfopCode;

                        f100Obj.piscstcode = detaillocPerItemList[i].PIScstCode;
                        f100Obj.pisbasisamount = detaillocPerItemList[i].sum_PIS_BasisAmount;
                        f100Obj.pispercent = detaillocPerItemList[i].PIS_Perc;
                        f100Obj.pisamount = detaillocPerItemList[i].sum_PIS_Amount;

                        f100Obj.cofinscstcode = detaillocPerItemList[i].COFINScstCode;
                        f100Obj.cofinsbasisamount = detaillocPerItemList[i].sum_COFINS_BasisAmount;
                        f100Obj.cofinspercent = detaillocPerItemList[i].COFINS_Perc;
                        f100Obj.cofinsamount = detaillocPerItemList[i].sum_COFINS_Amount;

                        if (['50', '51', '52', '53', '54', '55', '56', '60', '61', '62', '63', '64', '65', '66'].indexOf(detaillocPerItemList[i].COFINScstCode) >= 0)//COFINScstCode == PIScstCode
                           f100Obj.indOper = 0;
                        else if (['01', '02', '03', '05'].indexOf(detaillocPerItemList[i].COFINScstCode) >= 0)
                           f100Obj.indOper = 1;
                        else if (['04', '06', '07', '08', '09', '49', '99'].indexOf(detaillocPerItemList[i].COFINScstCode) >= 0)
                           f100Obj.indOper = 2;
                        else
                           f100Obj.indOper = '';


                        f100Obj.accountno = '';
                        f100Obj.lineamount = 0;
                        var accountLocalNo = '';
                        var itemNo = '';
                        var itemType = detaillocPerItemList[i].itemType;

                        var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                           if (Object.keys(value.itemObj).length) return (value.itemObj.id == detaillocPerItemList[i].no)
                        });


                        if (itemList.length > 0) {
                           itemList.map(function (item) {
                              f100Obj.lineamount += Number(item.grossAmount);
                           });

                           itemNo = itemList[0].itemObj.id;

                           if (Object.keys(itemList[0].itemObj.accountNo).length) {
                              accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                              f100Obj.accountno = accountLocalNo;
                           }
                        }

                        f100Obj.itemId = itemList[0].itemObj.itemId;
                        f100Obj.codeNatureBasis = getCodeNatureBasis(cfopcode, { no: itemNo, type: itemType })

                        if (transactionObj.transacBodyFields.fiscalType == 1)
                           f100Obj.creditSource = transactionObj.transacBodyFields.territory.name == 'EX' ? 1 : 0
                        else
                           f100Obj.creditSource = '';

                        this.objBlock.BlockF._f100List.push(f100Obj);


                        fill_0200List(itemList, transactionObj, taxSettlementRec, this.objBlock.Block0._0200List);
                        fill_0190List(itemList, transactionObj, this.objBlock.Block0._0190List);
                        fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);
                     }

                     this.objBlock.Block0._0150Obj = fill_0150Obj(transactionObj, taxSettlementRec);
                  }


                  if (
                     Object.keys(transactionObj.spedContributionSetupObj).length &&
                     transactionObj.spedContributionSetupObj.generateF100 == 'T' &&
                     transactionObj.transacBodyFields.fiscalType == 2
                  ) {
                     var otherChargeLine = transactionObj.headerlocSublistFields.detaillocList.filter(function (result) {
                        return (result.itemType == 'OthCharge')
                     })

                     for (var i = 0; i < otherChargeLine.length; i++) {

                        var f100Obj = {};
                        f100Obj.fiscalType = transactionObj.transacBodyFields.fiscalType;
                        f100Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                        f100Obj.docDate = transactionObj.transacBodyFields.docDate;
                        f100Obj.entity = '';

                        if (Object.keys(transactionObj.transacBodyFields.entityObj).length)
                           f100Obj.entity = transactionObj.transacBodyFields.getEntityCode();  //.entityObj.id;

                        var cfopcode = otherChargeLine[i].cfopCode;
                        var taxIdent = otherChargeLine[i].taxIdent;

                        f100Obj.piscstcode = otherChargeLine[i].cstCodePIS;
                        f100Obj.cofinscstcode = otherChargeLine[i].cstCodeCOFINS;


                        f100Obj.pisbasisamount = taxIdent == '3' ? otherChargeLine[i].base : 0;
                        f100Obj.pispercent = taxIdent == '3' ? otherChargeLine[i].perc : 0;
                        f100Obj.pisamount = taxIdent == '3' ? otherChargeLine[i].amount : 0;

                        f100Obj.cofinsbasisamount = taxIdent == '4' ? otherChargeLine[i].base : 0;
                        f100Obj.cofinspercent = taxIdent == '4' ? otherChargeLine[i].perc : 0;
                        f100Obj.cofinsamount = taxIdent == '4' ? otherChargeLine[i].amount : 0;

                        if (['50', '51', '52', '53', '54', '55', '56', '60', '61', '62', '63', '64', '65', '66'].indexOf(otherChargeLine[i].COFINScstCode))//COFINScstCode == PIScstCode
                           f100Obj.indOper = 0;
                        else if (['01', '02', '03', '05'].indexOf(otherChargeLine[i].COFINScstCode))
                           f100Obj.indOper = 1;
                        else if (['04', '06', '07', '08', '09', '49', '99'].indexOf(otherChargeLine[i].COFINScstCode))
                           f100Obj.indOper = 2;
                        else
                           f100Obj.indOper = '';

                        f100Obj.accountno = '';
                        f100Obj.lineamount = 0;
                        var accountLocalNo = '';
                        var itemNo = '';
                        var itemType = otherChargeLine[i].itemType;

                        var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                           if (Object.keys(value.itemObj).length) return (value.itemObj.id == otherChargeLine[i].itemNo)
                        });


                        if (itemList.length > 0) {
                           itemList.map(function (item) {
                              f100Obj.lineamount += Number(item.grossAmount);
                           });

                           itemNo = itemList[0].itemObj.id;

                           if (Object.keys(itemList[0].itemObj.accountNo).length) {
                              accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                              f100Obj.accountno = accountLocalNo;
                           }
                        }

                        f100Obj.itemId = itemList[0].itemObj.itemId;
                        f100Obj.codeNatureBasis = getCodeNatureBasis(cfopcode, { no: itemNo, type: itemType })

                        if (transactionObj.transacBodyFields.fiscalType == 1)
                           f100Obj.creditSource = transactionObj.transacBodyFields.territory.name == 'EX' ? 1 : 0
                        else
                           f100Obj.creditSource = '';

                        this.objBlock.BlockF._f100List.push(f100Obj);


                        fill_0200List(itemList, transactionObj, taxSettlementRec, this.objBlock.Block0._0200List);
                        fill_0190List(itemList, transactionObj, this.objBlock.Block0._0190List);
                        fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);
                     }

                     this.objBlock.Block0._0150Obj = fill_0150Obj(transactionObj, taxSettlementRec);
                  }
               } else {
                  return {};
               }
            },

            BlockI: function (transactionObj) {
               if (transactionObj && Object.keys(transactionObj).length) {
               } else {
                  return {};
               }
            },

            BlockG: function (transactionObj) {
               if (transactionObj && Object.keys(transactionObj).length) {
               } else {
                  return {};
               }
            },

            BlockH: function (transactionObj) {
               if (transactionObj && Object.keys(transactionObj).length) {
               } else {
                  return {};
               }
            },

            BlockK: function (transactionObj) {
               if (transactionObj && Object.keys(transactionObj).length) {
               } else {
                  return {};
               }
            },

            BlockM: function (transactionObj) {
               if (transactionObj && Object.keys(transactionObj).length) {

               } else {
                  return {};
               }
            },

            Block1: function (transactionObj) {
               this.objBlock.Block1._1900Obj = {};

               if (transactionObj && Object.keys(transactionObj).length) {

                  if (
                     (transactionObj.transactionType == 'invoice' || transactionObj.transactionType == 'cashsale') && Object.keys(transactionObj.spedContributionSetupObj).length &&
                     (transactionObj.spedContributionSetupObj.taxIncidenceCode == 2 && transactionObj.spedContributionSetupObj.calculationBasis == 1)
                  ) {
                     this.objBlock.Block1._1900Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                     this.objBlock.Block1._1900Obj.COD_MOD = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
                     this.objBlock.Block1._1900Obj.COD_SIT = checkTaxSituation(transactionObj);
                     this.objBlock.Block1._1900Obj.cpfCnpj = transactionObj.transacBodyFields.branchCodeObj.cnpj;
                     this.objBlock.Block1._1900Obj.VL_TOT_REC = transactionObj.headerLocBodyFields.totalAmountDiscount;
                     this.objBlock.Block1._1900Obj.pisCstCode = transactionObj.headerlocSublistFields.totalloc.cstCodePIS;
                     this.objBlock.Block1._1900Obj.cofinsCstCode = transactionObj.headerlocSublistFields.totalloc.cstCodeCOFINS;
                  }

               } else {
                  return {};
               }
            },

            Block9: function (transactionObj) {
               if (transactionObj && Object.keys(transactionObj).length) {
               } else {
                  return {};
               }
            },


            MakePercentAbstract: function (transactionObj) {

               if (transactionObj && Object.keys(transactionObj.headerlocSublistFields).length) {

                  // Monta um único objeto principal com valores padrão para linhas da Percent, e um array para valores dos impostos
                  var inOut;
                  if (
                     transactionObj.transactionType == 'vendorbill' ||
                     transactionObj.transactionType == 'creditmemo' ||
                     transactionObj.transactionType == 'itemreceipt'
                  ) {
                     inOut = 1; // Input
                  } else if (
                     transactionObj.transactionType == 'invoice' ||
                     transactionObj.transactionType == 'vendorcredit' ||
                     transactionObj.transactionType == 'cashsale' ||
                     transactionObj.transactionType == 'customsale_mts_transferinvoice_tr'
                  ) {
                     inOut = 2; // Output
                  }

                  // Monta um array com todas linhas de OthCharge
                  // var OthChargeDetailLinesArray = transactionObj.headerlocSublistFields.detaillocList.filter(function(result){
                  //     return (result.itemType == 'OthCharge')
                  // });

                  // Monta um array com todas linhas de ICMS nos detalhes daquela transação e ordena primeiro por CFOP Code e depois pela Porcentagem do ICMS
                  var ICMSdetailLinesArray = transactionObj.headerlocSublistFields.detaillocList.filter(function (result) {
                     return (
                        result.taxIdent == 2 &&
                        result.itemType != 'OthCharge'
                     ) // ICMS
                  });
                  ICMSdetailLinesArray.sort(function (a, b) {
                     if (a.cfopCode === b.cfopCode) {
                        return a.perc > b.perc ? 1 : -1;
                     }
                     return a.cfopCode > b.cfopCode ? 1 : -1;
                  });

                  // Monta um array com todas linhas de IPI nos detalhes daquela transação e ordena primeiro CFOP Code
                  // var IPIdetailLinesArray = transactionObj.headerlocSublistFields.detaillocList.filter(function(result){
                  //     return(result.taxIdent == 1) // IPI
                  // });
                  // IPIdetailLinesArray.sort(function (a, b){
                  //     return a.cfopCode > b.cfopCode? 1:-1;
                  // });

                  var percentAbstractObj = {};

                  percentAbstractObj.fiscalType = inOut;
                  percentAbstractObj.postingDate = transactionObj.transacBodyFields.date;
                  percentAbstractObj.fiscalDocType = transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod;
                  percentAbstractObj.specie = transactionObj.transacBodyFields.fiscalDocTypeObj.specie;
                  percentAbstractObj.serSubSer = transactionObj.transacBodyFields.printSerie;
                  percentAbstractObj.docNum = transactionObj.transactionId;
                  percentAbstractObj.externalDocNo = transactionObj.transacBodyFields.externalDocNo;
                  percentAbstractObj.tranId = transactionObj.transactionId;
                  percentAbstractObj.docDate = transactionObj.transacBodyFields.docDate;
                  percentAbstractObj.billToPayToNo = transactionObj.transacBodyFields.getEntityCode();      //.entityObj.id;
                  percentAbstractObj.terrCode = transactionObj.transacBodyFields.territory.name; //territoryCodeText;
                  percentAbstractObj.billToPayToName = transactionObj.transacBodyFields.entityObj.name;
                  percentAbstractObj.IE = transactionObj.transacBodyFields.entityObj.ie;
                  percentAbstractObj.CNPJ = transactionObj.transacBodyFields.entityObj.cpfOrCnpj;
                  percentAbstractObj.muniDipamCode = transactionObj.transacBodyFields.entityObj.muniDipamCode;
                  percentAbstractObj.observations = '';
                  percentAbstractObj.fiscalValues = [];
                  transactionObj.transacSubListFields.observationFiscalTextList.map(function (observTextObj) {
                     if (percentAbstractObj.observations)
                        percentAbstractObj.observations += '.' + observTextObj.text;
                     else
                        percentAbstractObj.observations = observTextObj.text;
                  });

                  var standFiscalTexts = createNewTextObsFiscText(transactionObj);
                  standFiscalTexts.map(function (stdFiscalTextObj) {
                     if (percentAbstractObj.observations)
                        percentAbstractObj.observations += '.' + stdFiscalTextObj.text;
                     else
                        percentAbstractObj.observations = stdFiscalTextObj.text;
                  });

                  // Insere todas linhas de ICMS no array para Percent
                  var arrayOfDetails = [];

                  if (ICMSdetailLinesArray.length) {

                     for (var count = 0; count < ICMSdetailLinesArray.length; count++) {

                        var otherChargeLineByRelation = transactionObj.headerlocSublistFields.detaillocList.filter(function (result) {
                           return (
                              result.itemType == 'OthCharge' &&
                              result.relationChargeItemLineNo == ICMSdetailLinesArray[count].invoiceLineNo &&
                              result.taxIdent == 2        // ICMS
                           )
                        });

                        var obj = {};
                        obj.invoiceLineNo = ICMSdetailLinesArray[count].invoiceLineNo;
                        obj.cfopCode = ICMSdetailLinesArray[count].cfopCode;
                        obj.ICMSPerc = ICMSdetailLinesArray[count].perc;
                        obj.ICMSBasisAmount = 0;
                        if (ICMSdetailLinesArray[count].noTaxCredit == false) {

                           if (ICMSdetailLinesArray[count].invoiceLineType != 'FixedAsset') {

                              obj.ICMSBasisAmount = ICMSdetailLinesArray[count].base;
                              for (var countTwo = 0; countTwo < otherChargeLineByRelation.length; countTwo++) {
                                 obj.ICMSBasisAmount = obj.ICMSBasisAmount + otherChargeLineByRelation[countTwo].base;
                              }

                           }
                        }

                        obj.ICMSExemptAmount = ICMSdetailLinesArray[count].exemptAmount;
                        for (var countTwo = 0; countTwo < otherChargeLineByRelation.length; countTwo++) {
                           obj.ICMSExemptAmount = obj.ICMSExemptAmount + otherChargeLineByRelation[countTwo].exemptAmount;
                        }


                        obj.ICMSOthersAmount = ICMSdetailLinesArray[count].othersBasisAmount;
                        for (var countTwo = 0; countTwo < otherChargeLineByRelation.length; countTwo++) {
                           obj.ICMSOthersAmount = obj.ICMSOthersAmount + otherChargeLineByRelation[countTwo].othersBasisAmount;
                        }

                        obj.ICMSAmount = 0;
                        if (ICMSdetailLinesArray[count].invoiceLineType != 'FixedAsset' && ICMSdetailLinesArray[count].noTaxCredit == false) {
                           obj.ICMSAmount = ICMSdetailLinesArray[count].amount;
                           for (var countTwo = 0; countTwo < otherChargeLineByRelation.length; countTwo++) {
                              obj.ICMSAmount = obj.ICMSAmount + otherChargeLineByRelation[countTwo].amount;
                           }
                        }

                        // get IPI informations
                        obj.IPIBasisAmount = 0;
                        obj.IPIExemptAmount = 0;
                        obj.IPIOthersAmount = 0;
                        obj.IPIAmount = 0;
                        var detailLocIPIList = transactionObj.headerlocSublistFields.detaillocList.filter(function (detailLoc) {
                           return (
                              detailLoc.taxIdent == '1' &&      // IPI
                              detailLoc.invoiceLineNo == obj.invoiceLineNo
                           );
                        });

                        detailLocIPIList.map(function (detLineIPI, detIndex) {
                           // get charge amounts
                           var totalizerObj = {};
                           totalizerObj.chargeBase = 0;
                           totalizerObj.chargeBaseOthers = 0;
                           totalizerObj.chargeBaseExempt = 0;
                           totalizerObj.chargeAmount = 0;
                           totalizerObj.chargeTotalAmtDiscounted = 0;

                           var filtersObj = {
                              taxIdentification: 1,       // IPI
                              invoiceLineNo: detLineIPI.invoiceLineNo
                           }

                           getDetailAmountsForCharge(transactionObj, filtersObj, totalizerObj);

                           //
                           if (!detLineIPI.noTaxCredit)
                              obj.IPIBasisAmount = detLineIPI.base + totalizerObj.chargeBase;

                           obj.IPIExemptAmount = detLineIPI.exemptAmount + totalizerObj.chargeBaseExempt;
                           obj.IPIAmount = detLineIPI.amount + totalizerObj.chargeAmount;

                           if (!detLineIPI.noTaxCredit) {
                              obj.IPIOthersAmount = detLineIPI.othersBasisAmount + totalizerObj.chargeBaseOthers;
                           } else {
                              // get LineLoc amounts
                              var lineLocFiltered = transactionObj.headerlocSublistFields.linelocList.filter(function (lineLoc) {
                                 return (lineLoc.lineNo == detLineIPI.invoiceLineNo)
                              });
                              if (lineLocFiltered.length)
                                 obj.IPIOthersAmount = lineLocFiltered[0].totalAmountDisconted + totalizerObj.chargeTotalAmtDiscounted;
                           }

                        });

                        var lineLocFilteredGLAmount = transactionObj.headerlocSublistFields.linelocList.filter(function (lineLoc) {
                           return (lineLoc.lineNo == ICMSdetailLinesArray[count].invoiceLineNo)
                        });

                        if (lineLocFilteredGLAmount.length) {
                           obj.GLAmount = lineLocFilteredGLAmount[0].totalAmountDisconted;

                           // get glamount from charges
                           var lineLocCharges = transactionObj.headerlocSublistFields.linelocList.filter(function (lineLoc) {
                              return (lineLoc.relationchargeitemlineno == lineLocFilteredGLAmount[0].lineNo)
                           });

                           lineLocCharges.map(function (lineLocChrg) {
                              obj.GLAmount += Number(lineLocChrg.totalAmountDisconted);
                           });


                        } else {
                           obj.GLAmount = 0;
                        }
                        arrayOfDetails.push(obj);

                     }
                  } else {

                     var detailLocIPIList = transactionObj.headerlocSublistFields.detaillocList.filter(function (detailLoc) {
                        return (
                           detailLoc.taxIdent == '1' &&
                           detailLoc.itemType != 'OthCharge'
                        );
                     });
                     detailLocIPIList.map(function (detailLoc) {
                        // get charge amounts
                        var totalizerObj = {};
                        totalizerObj.chargeBase = 0;
                        totalizerObj.chargeBaseOthers = 0;
                        totalizerObj.chargeBaseExempt = 0;
                        totalizerObj.chargeAmount = 0;
                        totalizerObj.chargeTotalAmtDiscounted = 0;

                        var filtersObj = {
                           taxIdentification: 1,       // IPI
                           invoiceLineNo: detailLoc.invoiceLineNo
                        }

                        getDetailAmountsForCharge(transactionObj, filtersObj, totalizerObj);

                        var fiscalValuesObj = {};
                        fiscalValuesObj.invoiceLineNo = detailLoc.invoiceLineNo;
                        fiscalValuesObj.cfopCode = detailLoc.cfopCode;
                        fiscalValuesObj.GLAmount = 0;
                        fiscalValuesObj.ICMSPerc = 0;
                        fiscalValuesObj.ICMSBasisAmount = 0;
                        fiscalValuesObj.ICMSExemptAmount = 0;
                        fiscalValuesObj.ICMSOthersAmount = 0;
                        fiscalValuesObj.ICMSAmount = 0;
                        fiscalValuesObj.IPIBasisAmount = 0;
                        fiscalValuesObj.IPIExemptAmount = 0;
                        fiscalValuesObj.IPIOthersAmount = 0;
                        fiscalValuesObj.IPIAmount = 0;

                        if (!detailLoc.noTaxCredit)
                           fiscalValuesObj.IPIBasisAmount = detailLoc.base + totalizerObj.chargeBase;

                        fiscalValuesObj.IPIExemptAmount = detailLoc.exemptAmount + totalizerObj.chargeBaseExempt;
                        fiscalValuesObj.IPIAmount = detailLoc.amount + totalizerObj.chargeAmount;

                        // get LineLoc amounts
                        var lineLocFiltered = transactionObj.headerlocSublistFields.linelocList.filter(function (lineLoc) {
                           return (lineLoc.lineNo == detailLoc.invoiceLineNo)
                        });

                        if (!detailLoc.noTaxCredit) {
                           fiscalValuesObj.IPIOthersAmount = detailLoc.othersBasisAmount + totalizerObj.chargeBaseOthers;
                        } else {
                           if (lineLocFiltered.length)
                              fiscalValuesObj.IPIOthersAmount = lineLocFiltered[0].totalAmountDisconted + totalizerObj.chargeTotalAmtDiscounted;
                        }

                        if (lineLocFiltered.length) {
                           fiscalValuesObj.GLAmount = lineLocFiltered[0].totalAmountDisconted;

                           // get glamount from charges
                           var lineLocCharges = transactionObj.headerlocSublistFields.linelocList.filter(function (lineLoc) {
                              return (lineLoc.relationchargeitemlineno == lineLocFiltered[0].lineNo)
                           });

                           lineLocCharges.map(function (lineLocChrg) {
                              fiscalValuesObj.GLAmount += Number(lineLocChrg.totalAmountDisconted);
                           });

                        } else {
                           fiscalValuesObj.GLAmount = 0;
                        }

                        arrayOfDetails.push(fiscalValuesObj);
                     });
                  }


                  // Adiciona valor nas propriedades de IPI no array já existente com linhas de ICMS, se o LineNo for igual
                  // var detailIndex;
                  // var ipiListWithoutICMS = [];

                  // for(var count = 0; count < IPIdetailLinesArray.length; count ++){

                  //     detailIndex = -1;

                  //     for(var countTwo = 0; countTwo < arrayOfDetails.length; countTwo++){
                  //         if (arrayOfDetails[countTwo].invoiceLineNo == IPIdetailLinesArray[countTwo].invoiceLineNo){
                  //             detailIndex = countTwo;
                  //             break;
                  //         }
                  //     }

                  //     if(detailIndex > -1){
                  //         arrayOfDetails[detailIndex].IPIBasisAmount = 0//IPIdetailLinesArray[count].a || '';
                  //         arrayOfDetails[detailIndex].IPIExemptAmount = 0//IPIdetailLinesArray[count].a || '';
                  //         arrayOfDetails[detailIndex].IPIOthersAmount = 0//IPIdetailLinesArray[count].a || '';
                  //         arrayOfDetails[detailIndex].IPIAmount = 0//IPIdetailLinesArray[count].a || '';
                  //     }else{
                  //         ipiListWithoutICMS.push(count);
                  //     }

                  // }

                  // Adiciona agora as linhas de IPI que não tinha seu LineNo igual a de nenhum ICMS
                  // for(var count = 0; count < ipiListWithoutICMS.length; count ++){

                  //     arrayOfDetails.push({
                  //         invoiceLineNo: IPIdetailLinesArray[ipiListWithoutICMS[count]].invoiceLineNo,
                  //         cfopCode: IPIdetailLinesArray[ipiListWithoutICMS[count]].cfopCode,
                  //         ICMSPerc: 0,
                  //         ICMSBasisAmount: 0,
                  //         ICMSExemptAmount: 0,
                  //         ICMSOthersAmount: 0,
                  //         ICMSAmount: 0,
                  //         IPIBasisAmount: 0,//IPIdetailLinesArray[ipiListWithoutICMS[count]].a || '',
                  //         IPIExemptAmount: 0,//IPIdetailLinesArray[ipiListWithoutICMS[count]].a || '',
                  //         IPIOthersAmount: 0,//IPIdetailLinesArray[ipiListWithoutICMS[count]].a || '',
                  //         IPIAmount: 0//IPIdetailLinesArray[ipiListWithoutICMS[count]].a || ''
                  //     });

                  // }

                  // Agrupa as linhas pelo CFOP Code e Porcentagem do ICMS
                  var lastArrayIndex;

                  for (var count = 0; count < arrayOfDetails.length; count++) {

                     if (transactionObj.transacBodyFields.creditOrReturn == '2') {// nota cancelada
                        arrayOfDetails[count].GLAmount = 0;
                        arrayOfDetails[count].ICMSBasisAmount = 0;
                        arrayOfDetails[count].ICMSExemptAmount = 0;
                        arrayOfDetails[count].ICMSOthersAmount = 0;
                        arrayOfDetails[count].ICMSAmount = 0;
                        arrayOfDetails[count].IPIBasisAmount = 0;
                        arrayOfDetails[count].IPIExemptAmount = 0;
                        arrayOfDetails[count].IPIOthersAmount = 0;
                        arrayOfDetails[count].IPIAmount = 0;
                        arrayOfDetails[count].ICMSPerc = 0;
                     }

                     lastArrayIndex = percentAbstractObj.fiscalValues.length - 1;

                     if (
                        count > 0 &&
                        arrayOfDetails[count].cfopCode == percentAbstractObj.fiscalValues[lastArrayIndex].cfopCode &&
                        arrayOfDetails[count].ICMSPerc == percentAbstractObj.fiscalValues[lastArrayIndex].ICMSPerc
                     ) {
                        percentAbstractObj.fiscalValues[lastArrayIndex].GLAmount += arrayOfDetails[count].GLAmount;
                        percentAbstractObj.fiscalValues[lastArrayIndex].ICMSBasisAmount += arrayOfDetails[count].ICMSBasisAmount;
                        percentAbstractObj.fiscalValues[lastArrayIndex].ICMSExemptAmount += arrayOfDetails[count].ICMSExemptAmount;
                        percentAbstractObj.fiscalValues[lastArrayIndex].ICMSOthersAmount += arrayOfDetails[count].ICMSOthersAmount;
                        percentAbstractObj.fiscalValues[lastArrayIndex].ICMSAmount += arrayOfDetails[count].ICMSAmount;
                        percentAbstractObj.fiscalValues[lastArrayIndex].IPIBasisAmount += arrayOfDetails[count].IPIBasisAmount;
                        percentAbstractObj.fiscalValues[lastArrayIndex].IPIExemptAmount += arrayOfDetails[count].IPIExemptAmount;
                        percentAbstractObj.fiscalValues[lastArrayIndex].IPIOthersAmount += arrayOfDetails[count].IPIOthersAmount;
                        percentAbstractObj.fiscalValues[lastArrayIndex].IPIAmount += arrayOfDetails[count].IPIAmount;
                     } else {
                        percentAbstractObj.fiscalValues.push(arrayOfDetails[count]);
                     }
                  }

                  for (var count = 0; count < percentAbstractObj.fiscalValues.length; count++) {
                     var dipamCode = "";

                     if (percentAbstractObj.fiscalValues[count].cfopCode) {
                        search.create({
                           type: "customrecord_mts_cfopcodes",
                           filters: [
                              ["custrecord_mts_fiscalcode_cfopcodes", "is", percentAbstractObj.fiscalValues[count].cfopCode]
                           ],
                           columns: [
                              "custrecord_mts_dipamcode_cfopcodes"
                           ]
                        }).run().each(function (result) {
                           dipamCode = result.getValue({ name: "custrecord_mts_dipamcode_cfopcodes" });
                        });
                     }

                     percentAbstractObj.fiscalValues[count].dipamCode = dipamCode;
                     percentAbstractObj.fiscalValues[count].dipamGlAmount = percentAbstractObj.fiscalValues[count].ICMSBasisAmount + percentAbstractObj.fiscalValues[count].ICMSExemptAmount + percentAbstractObj.fiscalValues[count].ICMSOthersAmount;

                  }

                  this.objBlock.PercentAbstractObj = percentAbstractObj;

               }
            },

            MakeStateAbstract: function (transactionObj) {

               if (transactionObj && Object.keys(transactionObj).length) {
                  this.objBlock.StateAbstractObj = {};
                  this.objBlock.StateAbstractObj.fiscalValues = [];

                  if (
                     transactionObj.transactionType == 'vendorbill' ||
                     transactionObj.transactionType == 'creditmemo' ||
                     transactionObj.transactionType == 'itemreceipt'
                  ) {
                     this.objBlock.StateAbstractObj.fiscalType = 1; // Input
                  } else if (
                     transactionObj.transactionType == 'invoice' ||
                     transactionObj.transactionType == 'vendorcredit' ||
                     transactionObj.transactionType == 'cashsale' ||
                     transactionObj.transactionType == 'customsale_mts_transferinvoice_tr'
                  ) {
                     this.objBlock.StateAbstractObj.fiscalType = 2; // Output
                  }

                  this.objBlock.StateAbstractObj.territoryCode = transactionObj.transacBodyFields.territory.id || '';
                  this.objBlock.StateAbstractObj.glamount = transactionObj.headerLocBodyFields.totalAmountDiscount;
                  this.objBlock.StateAbstractObj.glamount1 = getGlamountOneAndTwo('COFINS Ret.', transactionObj);
                  this.objBlock.StateAbstractObj.glamount2 = getGlamountOneAndTwo('PIS Ret.', transactionObj);
                  this.objBlock.StateAbstractObj.glamount3 = transactionObj.headerLocBodyFields.totalAmountDiscount;


                  this.objBlock.StateAbstractObj.fiscalValues = groupIcmsAndIpiByCfop(transactionObj)



               } else {
                  return {};
               }
            },

            MakeCFOPAbstract: function (transactionObj) {

               // var transactionsArr = transactionObj.headerlocSublistFields.detaillocList;

               var arrAux = detailLocFilterCFOPCode(transactionObj);

               this.objBlock.CFOPAbstract = arrAux;
            }
         }


         function fill_0150Obj(transactionObj, taxSettlementRec) {
            var _0150Obj = {};

            // var generateERPPisCofins = taxSettlementRec.getValue({fieldId:'custrecord_mts_generateefdpis_taxsettlem'});
            // if(transactionObj.transacBodyFields.fiscalType==1 && transactionObj.headerlocSublistFields.totalloc.sum_PIS_Amount==0 && generateERPPisCofins)
            //     var participantRegNOT = false;
            // else
            //     var participantRegNOT = true;

            if (checkTaxSituation(transactionObj) != '02') { //&& participantRegNOT ){
               if (transactionObj.transacBodyFields.entityObj.id) {
                  _0150Obj.code = transactionObj.transacBodyFields.getEntityCode();
                  _0150Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                  _0150Obj.description = transactionObj.transacBodyFields.entityObj.name;
                  _0150Obj.countryCode = transactionObj.transacBodyFields.billingAddress.countryBacenCode;
                  _0150Obj.address = transactionObj.transacBodyFields.billingAddress.address;
                  _0150Obj.ibgeCityCode = transactionObj.transacBodyFields.billingAddress.ibgecityCode;
                  _0150Obj.number = transactionObj.transacBodyFields.billingAddress.number;
                  _0150Obj.address2 = transactionObj.transacBodyFields.billingAddress.complement;
                  _0150Obj.district = transactionObj.transacBodyFields.billingAddress.district;
                  _0150Obj.category = transactionObj.transacBodyFields.entityObj.category;
                  _0150Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;

                  if (transactionObj.transacBodyFields.fiscalType == 2)
                     _0150Obj.suframa = transactionObj.transacBodyFields.entityObj.suframa;
                  else
                     _0150Obj.suframa = '';

                  if (transactionObj.transacBodyFields.entityObj.category == 1) {    //person
                     _0150Obj.cpf = transactionObj.transacBodyFields.entityObj.cpfOrCnpj.replace(/\D/g, '');
                     _0150Obj.cnpj = '';
                  } else if (transactionObj.transacBodyFields.entityObj.category == 2) {    //company
                     _0150Obj.cnpj = transactionObj.transacBodyFields.entityObj.cpfOrCnpj.replace(/\D/g, '');
                     _0150Obj.cpf = '';
                  } else {
                     _0150Obj.cpf = '';
                     _0150Obj.cnpj = '';
                  }


                  if (transactionObj.transacBodyFields.entityObj.ie == 'ISENTO')
                     _0150Obj.ie = '';
                  else
                     _0150Obj.ie = transactionObj.transacBodyFields.entityObj.ie;
               }

               _0150Obj._0175List = '';
            }


            return _0150Obj;
         }

         function fill_0190List(itemList, transactionObj, _0190List) {

            for (var i = 0; i < itemList.length; i++) {

               if (Object.keys(itemList[i].itemObj).length) {
                  if (Object.keys(itemList[i].unitMeasureObj).length)
                     if (itemList[i].unitMeasureObj.unitMeasureCode)
                        _0190List.push({
                           code: itemList[i].unitMeasureObj.code,
                           description: itemList[i].unitMeasureObj.description,
                           unitMeasureCode: itemList[i].unitMeasureObj.unitMeasureCode,
                           branchCode: transactionObj.transacBodyFields.branchCodeObj.id
                        });

                  if ((itemList[i].itemObj.type == 'inventoryitem' && itemList[i].unit != itemList[i].itemObj.stockUnit) ||
                     (itemList[i].itemObj.type != 'inventoryitem' && itemList[i].unit != itemList[i].itemObj.baseUnit)) {

                     if (Object.keys(itemList[i].itemObj.unitMeasureObj).length)
                        if (itemList[i].itemObj.unitMeasureObj.unitMeasureCode)
                           _0190List.push({
                              code: itemList[i].itemObj.unitMeasureObj.code,
                              description: itemList[i].itemObj.unitMeasureObj.description,
                              unitMeasureCode: itemList[i].itemObj.unitMeasureObj.unitMeasureCode,
                              branchCode: transactionObj.transacBodyFields.branchCodeObj.id
                           });
                  }
               }
            }
         }

         function fill_0200List(itemList, transactionObj, taxSettlementRec, _0200List) {
            for (var i = 0; i < itemList.length; i++) {

               if (Object.keys(itemList[i].itemObj).length) {
                  var _0200Obj = {};

                  _0200Obj.mustBeCreated = true;
                  _0200Obj.itemCode = itemList[i].itemObj.id;
                  _0200Obj.productCode = itemList[i].itemObj.producttype;
                  _0200Obj.prodOrderNo = itemList[i].itemObj.itemId;
                  _0200Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
                  _0200Obj.startDate = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_startdate_taxsettlem' });
                  _0200Obj.endDate = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_enddate_taxsettlem' });


                  if (Object.keys(itemList[i].itemObj.unitMeasureObj).length)
                     _0200Obj.unitofmeasure = itemList[i].itemObj.unitMeasureObj.unitMeasureCode;

                  _0200Obj.type = itemList[i].itemObj.type;
                  _0200Obj.description = itemList[i].itemObj.description;
                  _0200Obj.descriptionTwo = '';
                  _0200Obj.itemType = itemList[i].itemObj.producttype;
                  _0200Obj.genBusPostingGroup = itemList[i].itemObj.genprodposgroup;

                  var ncmCode = itemList[i].itemObj.ncmcode;
                  var tariffNumberObj = ncmCode ? getTariffNumber(ncmCode) : {};

                  if (Object.keys(tariffNumberObj).length) {
                     _0200Obj.excCodeNbmSh = tariffNumberObj.excncmcode;
                     _0200Obj.nbmSh = tariffNumberObj.id;
                  } else {
                     _0200Obj.excCodeNbmSh = '';
                     _0200Obj.nbmSh = '';
                  }

                  if (itemList[i].itemObj.cestcode)
                     _0200Obj.cestCode = itemList[i].itemObj.cestcode;
                  else
                     _0200Obj.cestCode = tariffNumberObj ? tariffNumberObj.cestcode : '';

                  _0200Obj.servicecode = itemList[i].itemObj.id;



                  var icmsPerc = 0;

                  if (!itemList[i].itemObj.icmsInternalSpedObj)
                     icmsPerc = transactionObj.headerlocSublistFields.totalloc.perc_ICMS;
                  else
                     icmsPerc = itemList[i].itemObj.icmsInternalSpedObj;


                  _0200Obj.icmsPerc = icmsPerc;

                  _0200Obj._0220Obj = {};
                  if ((itemList[i].itemObj.type == 'inventoryitem' && itemList[i].unit != itemList[i].itemObj.stockUnit) ||
                     (itemList[i].itemObj.type != 'inventoryitem' && itemList[i].unit != itemList[i].itemObj.baseUnit))
                     _0200Obj._0220Obj = fill_0220Obj(itemList[i]);

                  _0200List.push(_0200Obj);
               }
            }
         }

         function fill_0220Obj(lineItem) {

            if (Object.keys(lineItem).length) {

               var unitsTypeId = lineItem.itemObj.unitstype;

               if (unitsTypeId) {
                  var unitsMeasureRec = record.load({
                     type: 'unitstype',
                     id: unitsTypeId
                  });

                  var lineNumber = unitsMeasureRec.findSublistLineWithValue({
                     sublistId: 'uom',
                     fieldId: 'abbreviation',
                     value: lineItem.unit
                  });

                  if (lineNumber > 0) {
                     var code = unitsMeasureRec.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'abbreviation',
                        line: lineNumber
                     });

                     var qtyUnitMeasure = unitsMeasureRec.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'conversionrate',
                        line: lineNumber
                     });


                     return {
                        code: Object.keys(lineItem.unitMeasureObj).length ? lineItem.unitMeasureObj.unitMeasureCode : code,
                        qtyUnitMeasure: qtyUnitMeasure
                     };
                  }
               }
            }
            return {};
         }

         function fill_0400List(_0400_CFOPList, transactionObj, _0400List) {
            for (var i = 0; i < _0400_CFOPList.length; i++) {
               var _0400Obj = _0400_CFOPList[i];
               _0400Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;
               _0400List.push(_0400Obj);
            }
         }

         function fill_0500List(accountLocalNo, _0500List) {
            var _0500Obj = {};

            if (accountLocalNo) {
               var spedAccountObj = getSpedAccount(accountLocalNo);

               if (Object.keys(spedAccountObj).length) {
                  _0500Obj.changeDate = spedAccountObj.inclusionDate || '';
                  _0500Obj.accountType = spedAccountObj.accountType || '';
                  _0500Obj.accountCode = spedAccountObj.number || '';
                  _0500Obj.accountName = spedAccountObj.name || '';
                  _0500Obj.indentation = spedAccountObj.indentation || '';
                  _0500Obj.nivel = spedAccountObj.nivel || '';
               }
            }

            _0500List.push(_0500Obj);
         }




         function fill_A110List(transactionObj) {
            var lines = transactionObj.transacSubListFields.additionalInvTextList.length;
            var _a110List = [];

            for (var i = 0; i < lines; i++) {
               _a110List.push({
                  text: transactionObj.transacSubListFields.additionalInvTextList[i].text,
                  spedaddc: transactionObj.transacSubListFields.additionalInvTextList[i].code,
                  branchCode: transactionObj.transacBodyFields.branchCodeObj.id,
               })
            }

            return _a110List;
         }

         function fill_A170List(transactionObj, taxSettlementRec) {
            var _a170List = [];
            var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

            for (var i = 0; i < detaillocPerItemList.length; i++) {

               var a170Obj = {};

               if (transactionObj.transacBodyFields.fiscalType == 1)
                  a170Obj.creditSource = transactionObj.transacBodyFields.territory.name == 'EX' ? 1 : 0
               else
                  a170Obj.creditSource = '';

               a170Obj.branchCode = transactionObj.transacBodyFields.branchCodeObj.id;

               a170Obj.cfopcode = detaillocPerItemList[i].cfopCode;
               a170Obj.sqcfopcode = detaillocPerItemList[i].cfopSequentialCode;
               a170Obj.piscstcode = detaillocPerItemList[i].PIScstCode;
               a170Obj.pisbasisamount = detaillocPerItemList[i].sum_PIS_BasisAmount;
               a170Obj.pispercent = detaillocPerItemList[i].PIS_Perc;
               a170Obj.pisamount = detaillocPerItemList[i].sum_PIS_Amount;
               a170Obj.cofinscstcode = detaillocPerItemList[i].COFINScstCode;
               a170Obj.cofinsbasisamount = detaillocPerItemList[i].sum_COFINS_BasisAmount;
               a170Obj.cofinspercent = detaillocPerItemList[i].COFINS_Perc;
               a170Obj.cofinsamount = detaillocPerItemList[i].sum_COFINS_Amount;

               a170Obj.no = '';
               a170Obj.description = '';
               a170Obj.accountno = '';
               a170Obj.lineamount = 0;
               a170Obj.codeBaseCalcCredit = '';

               var accountLocalNo = '';

               var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                  if (Object.keys(value.itemObj).length) return (value.itemObj.id == detaillocPerItemList[i].no)
               });


               if (itemList.length > 0) {
                  itemList.map(function (item) {
                     a170Obj.lineamount += Number(item.grossAmount);
                  });

                  a170Obj.no = itemList[0].itemObj.itemId;
                  a170Obj.codeBaseCalcCredit = itemList[0].itemObj.codeBaseCalcCredit;

                  if (Object.keys(itemList[0].itemObj.accountNo).length) {
                     accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                     a170Obj.accountno = accountLocalNo;
                  }
               }

               fill_0190List(itemList, transactionObj, this.objBlock.Block0._0190List);
               fill_0200List(itemList, transactionObj, taxSettlementRec, this.objBlock.Block0._0200List);
               fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);

               _a170List.push(a170Obj);
            }
            return _a170List;
         }


         function fill_C110List(transactionObj) {
            var lines = transactionObj.transacSubListFields.additionalInvTextList.length;
            var _c110List = [];

            for (var i = 0; i < lines; i++) {
               _c110List.push({
                  text: transactionObj.transacSubListFields.additionalInvTextList[i].text,
                  spedaddc: transactionObj.transacSubListFields.additionalInvTextList[i].code,
                  branchCode: transactionObj.transacBodyFields.branchCodeObj.id,
                  _c113List: fill_C113List(transactionObj),
                  // _c115List:fill_C115List(transactionObj)
               })
            }

            return _c110List;
         }

         function fill_C113List(transactionObj) {
            var lines = transactionObj.transacSubListFields.itemList.length;

            var _c113List = [];
            var docRefNoList = [];

            for (var i = 0; i < lines; i++) {
               var docFisRefNo = transactionObj.transacSubListFields.itemList[i].documentReferenceObj.id;

               if (docFisRefNo && docRefNoList.indexOf(docFisRefNo) < 0) {
                  docRefNoList.push(docFisRefNo);
                  var tranLineObj = transactionObj.transacSubListFields.itemList[i];

                  _c113List.push({
                     fiscaltype: transactionObj.transacBodyFields.fiscalType,
                     fiscaldoctype: transactionObj.transacBodyFields.fiscalDocTypeObj.id,
                     billtopaytono: tranLineObj.documentReferenceObj.entityId,
                     printserie: tranLineObj.documentReferenceObj.printSerie,
                     printsubserie: tranLineObj.documentReferenceObj.printSubSerie,
                     externaldocno: tranLineObj.documentReferenceObj.externalDocumentNo,
                     nfeketacess: tranLineObj.documentReferenceObj.eletrInvObj.nfeKeyAccess
                  });
               }
            }

            return _c113List;
         }

         function fill_C120List(transactionObj) {
            var _c120List = [];
            if (transactionObj.transacBodyFields.noDi) {
               var ficscalModelCode = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod : '';
               if (ficscalModelCode == '01') {
                  _c120List.push({
                     dino: transactionObj.transacBodyFields.noDi,
                     pisamount: transactionObj.headerlocSublistFields.totalloc.sum_PIS_Amount,
                     cofinsamount: transactionObj.headerlocSublistFields.totalloc.sum_COFINS_Amount,
                  })
               }
            }
            return _c120List;
         }

         function fill_C141List(transactionObj) {
            var lines = transactionObj.transacSubListFields.installmentList.length;

            var _c141List = [];

            for (var i = 0; i < lines; i++) {

               _c141List.push({
                  installmentno: transactionObj.transacSubListFields.installmentList[i].installmentNumber,
                  duedate: transactionObj.transacSubListFields.installmentList[i].dueDate,
                  amountlcy: transactionObj.transacSubListFields.installmentList[i].amountDue
               })
            }

            return _c141List;
         }

         function fill_C170List(transactionObj, taxSettlementRec) {
            var fiscalModelCode = transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod;
            var shipToDoc = transactionObj.transacBodyFields.fiscalDocTypeObj ? transactionObj.transacBodyFields.fiscalDocTypeObj.shiptodocty : '';

            var isSpedContribution = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_generateefdpis_taxsettlem' });

            if (fiscalModelCode != '55' || (!isSpedContribution && shipToDoc == 0))
               return {}


            var _c170List = [];
            var _0400_CFOPList = [];

            var itemList = transactionObj.transacSubListFields.itemList;
            for (var i = 0; i < itemList.length; i++) {
               if (itemList[i].itemObj.type == 'otherchargeitem') {
                  var useThatItem = true;

                  transactionObj.headerlocSublistFields.detaillocList.map(function (detLine) {
                     if (detLine.relationChargeItemLineNo)
                        useThatItem = false;
                  })

                  if (!useThatItem)
                     continue;
               }

               var c170Obj = {};
               var accountLocalNo = '';

               c170Obj.no = itemList[i].itemObj.itemId;
               c170Obj.lineamount = itemList[i].grossAmount;

               if (Object.keys(itemList[i].unitMeasureObj).length)
                  c170Obj.unitofmeasure = itemList[i].unitMeasureObj.unitMeasureCode;

               if (Object.keys(itemList[i].itemObj).length && Object.keys(itemList[i].itemObj.accountNo).length) {
                  accountLocalNo = itemList[i].itemObj.accountNo.localNo;
                  c170Obj.accountno = accountLocalNo;
               }

               c170Obj.cstcode = '';
               c170Obj.piscstcode = '';
               c170Obj.ipicstcode = '';
               c170Obj.cofinscstcode = '';

               c170Obj.icmspercent = '';
               c170Obj.ipipercent = '';
               c170Obj.pispercent = '';
               c170Obj.cofinspercent = '';
               c170Obj.issqnpercent = '';
               c170Obj.icmsstpercent = '';


               c170Obj.icmsbasisamount = 0;
               c170Obj.icmsstbasis = 0;
               c170Obj.pisbasisamount = 0;
               c170Obj.cofinsbasisamount = 0;
               c170Obj.issqnbasisamount = 0;
               c170Obj.ipibasisamount = 0;

               c170Obj.icmsamount = 0;
               c170Obj.icmsstamount = 0;
               c170Obj.ipiamount = 0;
               c170Obj.pisamount = 0;
               c170Obj.cofinsamount = 0;
               c170Obj.issqnamount = 0;

               c170Obj.exemptionicms = 0;

               var detaillocList = transactionObj.headerlocSublistFields.detaillocList.filter(function (detLine) {
                  return (detLine.invoiceLineNo == itemList[i].invoiceLineNo || detLine.relationChargeItemLineNo == itemList[i].invoiceLineNo)
               });

               detaillocList.map(function (detLine) {
                  if (detLine.itemType == 'InvtPart') {

                     if (Object.keys(transactionObj.transacBodyFields.operationTypeObj).length &&
                        !transactionObj.transacBodyFields.operationTypeObj.itemEntry)
                        c170Obj.itemMov = '1';
                     else
                        c170Obj.itemMov = '0';
                  } else {
                     c170Obj.itemMov = '1';
                  }

                  c170Obj.linequantity = Number(detLine.lineQuantity).toFixed(2);
                  c170Obj.cfopcode = detLine.cfopCode;
                  c170Obj.sqcfopcode = detLine.cfopSequentialCode;
                  c170Obj.cfopdescription = detLine.cfopDesc;

                  var taxIdent = detLine.taxIdent;
                  switch (taxIdent) {
                     case '2':
                        c170Obj.icmsbasisamount += detLine.base;
                        c170Obj.icmsamount += detLine.amount;
                        c170Obj.icmspercent = detLine.perc;
                        c170Obj.cstcode = detLine.cstCodeICMS;

                        break;
                     case '15':
                        c170Obj.icmsstbasis += detLine.base;
                        c170Obj.icmsstamount += detLine.amount;
                        c170Obj.icmsstpercent = detLine.perc;

                        break;
                     case '1':
                        c170Obj.ipibasisamount += detLine.base;
                        c170Obj.ipiamount += detLine.amount;
                        c170Obj.ipipercent = detLine.perc;
                        c170Obj.ipicstcode = detLine.cstCodeIPI;

                        break;
                     case '3':
                        c170Obj.pisbasisamount += detLine.base;
                        c170Obj.pisamount += detLine.amount;
                        c170Obj.pispercent = detLine.perc;
                        c170Obj.piscstcode = detLine.cstCodePIS;

                        break;
                     case '4':
                        c170Obj.cofinsbasisamount += detLine.base;
                        c170Obj.cofinsamount += detLine.amount;
                        c170Obj.cofinspercent = detLine.perc;
                        c170Obj.cofinscstcode = detLine.cstCodeCOFINS;

                        break;
                     case '8':
                        c170Obj.issqnbasisamount += detLine.base;
                        c170Obj.issqnamount += detLine.amount;
                        c170Obj.issqnpercent = detLine.perc;

                        break;
                     default:
                        break;
                  }

                  c170Obj.exemptionicms += detLine.exemptionICMS;
                  _0400_CFOPList.push(
                     {
                        code: detLine.cfopCode + detLine.cfopSequentialCode,
                        description: detLine.cfopDesc,
                        branchCode: transactionObj.transacBodyFields.branchCodeObj.id
                     }
                  );
               });

               fill_0200List([].concat(itemList[i]), transactionObj, taxSettlementRec, this.objBlock.Block0._0200List);
               fill_0190List([].concat(itemList[i]), transactionObj, this.objBlock.Block0._0190List);
               fill_0400List(_0400_CFOPList, transactionObj, this.objBlock.Block0._0400List);

               fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);


               _c170List.push(c170Obj);
            }
            return _c170List;
         };

         function fill_C190List(transactionObj) {
            var _c190List = [];

            // _c190List = detailLocFiltering_CST_CFOP_IcmsPerc(transactionObj.headerlocSublistFields.detaillocList);
            _c190List = detailLocFiltering_CST_CFOP_IcmsPerc(transactionObj);

            // var _c190List = [];

            // for(var i = 0; i < detailLocWithFilter.length; i++){
            //     _c190List.push({
            //         cstcode: detailLocWithFilter[i].cstcode,
            //         cfopcode: detailLocWithFilter[i].cfopCode,
            //         icmspercent: detailLocWithFilter[i].icmspercent,
            //         glamount:  transactionObj.headerLocBodyFields.totalAmountDiscount,
            //         icmsbasisamount: detailLocWithFilter[i].sum_ICMS_BasisAmount,
            //         icmsexemptamount: detailLocWithFilter[i].sum_ICMS_ExemptAmount,
            //         icmsothersamount: detailLocWithFilter[i].sum_ICMS_OthersAmount,
            //         icmsamount: detailLocWithFilter[i].sum_ICMS_Amount,
            //         icmsstbasis: detailLocWithFilter[i].sum_ST_ICMSbasisAmount,
            //         icmsstamount: detailLocWithFilter[i].sum_ST_ICMSamount,
            //         ipiamount: detailLocWithFilter[i].sum_IPI_Amount,
            //         vlfcpop: detailLocWithFilter[i].vl_fcp_op,
            //         vlfcpst: detailLocWithFilter[i].vl_fcp_st,
            //         vlfcpret: detailLocWithFilter[i].vl_fcp_ret,
            //     });
            // }
            return _c190List;
         }

         function fill_C195List(transactionObj) {
            var lines = transactionObj.transacSubListFields.observationFiscalTextList.length;

            var _c195List = [];

            for (var i = 0; i < lines; i++) {

               var text = transactionObj.transacSubListFields.observationFiscalTextList[i].text;
               if (text) {
                  _c195List.push({
                     addtextcode: transactionObj.transacSubListFields.observationFiscalTextList[i].code,
                     addtextsubcode: '',
                     text: transactionObj.transacSubListFields.observationFiscalTextList[i].text,
                  });
               }
            }

            var texts = createNewTextObsFiscText(transactionObj)
            if (texts.length)
               _c195List = _c195List.concat(texts);

            return _c195List;
         }

         function fill_C501List(transactionObj) {

            var _c501List = [];
            var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

            for (var i = 0; i < detaillocPerItemList.length; i++) {

               var c501Obj = {};
               c501Obj.taxIdent = 3; //PIS
               var cfopcode = detaillocPerItemList[i].cfopCode;
               c501Obj.piscstcode = detaillocPerItemList[i].PIScstCode;
               c501Obj.pisbasisamount = detaillocPerItemList[i].sum_PIS_BasisAmount;
               c501Obj.pispercent = detaillocPerItemList[i].PIS_Perc;
               c501Obj.pisamount = detaillocPerItemList[i].sum_PIS_Amount;
               c501Obj.accountno = '';
               c501Obj.lineamount = 0;
               var itemNo = '';
               var itemType = detaillocPerItemList[i].itemType;
               var accountLocalNo = '';

               var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                  if (Object.keys(value.itemObj).length) return (value.itemObj.id == detaillocPerItemList[i].no)
               });


               if (itemList.length > 0) {
                  itemList.map(function (item) {
                     c501Obj.lineamount += Number(item.grossAmount);
                  });

                  itemNo = itemList[0].itemObj.id;

                  if (Object.keys(itemList[0].itemObj.accountNo).length) {
                     accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                     c501Obj.accountno = accountLocalNo;
                  }
               }

               c501Obj.codeNatureBasis = getCodeNatureBasis(cfopcode, { no: itemNo, type: itemType })
               _c501List.push(c501Obj)

               fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);
            }
            return _c501List;
         }

         function fill_C505List(transactionObj) {
            var _c505List = [];
            var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

            for (var i = 0; i < detaillocPerItemList.length; i++) {

               var c505Obj = {};

               c505Obj.taxIdent = 4; //COFINS
               var cfopcode = detaillocPerItemList[i].cfopCode;
               c505Obj.cofinscstcode = detaillocPerItemList[i].COFINScstCode;
               c505Obj.cofinsbasisamount = detaillocPerItemList[i].sum_COFINS_BasisAmount;
               c505Obj.cofinspercent = detaillocPerItemList[i].COFINS_Perc;
               c505Obj.cofinsamount = detaillocPerItemList[i].sum_COFINS_Amount;
               c505Obj.accountno = '';
               c505Obj.lineamount = 0;
               var itemNo = '';
               var itemType = detaillocPerItemList[i].itemType;
               var accountLocalNo = '';

               var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                  if (Object.keys(value.itemObj).length) return (value.itemObj.id == detaillocPerItemList[i].no)
               });


               if (itemList.length > 0) {
                  itemList.map(function (item) {
                     c505Obj.lineamount += Number(item.grossAmount);
                  });

                  itemNo = itemList[0].itemObj.id;

                  if (Object.keys(itemList[0].itemObj.accountNo).length) {
                     accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                     c505Obj.accountno = accountLocalNo;
                  }
               }

               c505Obj.codeNatureBasis = getCodeNatureBasis(cfopcode, { no: itemNo, type: itemType })
               _c505List.push(c505Obj);

               fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);
            }
            return _c505List;
         }

         function fill_C590List(transactionObj) {
            var _c590List = [];

            _c590List = detailLocFiltering_CST_CFOP_IcmsPerc(transactionObj);

            // var _c590List = [];

            // for(var i = 0; i < detailLocWithFilter.length; i++){

            //     _c590List.push({
            //         cstcode: detailLocWithFilter[i].cstcode,
            //         cfopcode: detailLocWithFilter[i].cfopCode,
            //         icmspercent: detailLocWithFilter[i].icmspercent,
            //         glamount: transactionObj.headerLocBodyFields.totalAmountDiscount,
            //         icmsbasisamount: detailLocWithFilter[i].sum_ICMS_BasisAmount,
            //         icmsamount: detailLocWithFilter[i].sum_ICMS_Amount,
            //         icmsexemptamount: detailLocWithFilter[i].sum_ICMS_ExemptAmount,
            //         icmsothersamount: detailLocWithFilter[i].sum_ICMS_OthersAmount,
            //     });
            // }

            return _c590List;
         }




         function fill_D101List(transactionObj) {

            var _d101List = [];
            var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

            for (var i = 0; i < detaillocPerItemList.length; i++) {

               var d101Obj = {};
               d101Obj.taxIdent = 3; //PIS
               var cfopcode = detaillocPerItemList[i].cfopCode;
               d101Obj.piscstcode = detaillocPerItemList[i].PIScstCode;
               d101Obj.pisbasisamount = detaillocPerItemList[i].sum_PIS_BasisAmount;
               d101Obj.pispercent = detaillocPerItemList[i].PIS_Perc;
               d101Obj.pisamount = detaillocPerItemList[i].sum_PIS_Amount;
               d101Obj.indicatorNatureOfFreight = transactionObj.transacBodyFields.indicatorNatureOfFreight;

               d101Obj.accountno = '';
               d101Obj.lineamount = 0;
               var itemNo = '';
               var itemType = detaillocPerItemList[i].itemType;
               var accountLocalNo = '';

               var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                  if (Object.keys(value.itemObj).length) return (value.itemObj.id == detaillocPerItemList[i].no)
               });


               if (itemList.length > 0) {
                  itemList.map(function (item) {
                     d101Obj.lineamount += Number(item.grossAmount);
                  });

                  itemNo = itemList[0].itemObj.id;

                  if (Object.keys(itemList[0].itemObj.accountNo).length) {
                     accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                     d101Obj.accountno = accountLocalNo;
                  }
               }

               d101Obj.codeNatureBasis = getCodeNatureBasis(cfopcode, { no: itemNo, type: itemType })
               _d101List.push(d101Obj)

               fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);
            }
            return _d101List;
         }

         function fill_D105List(transactionObj) {
            var _d105List = [];
            var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

            for (var i = 0; i < detaillocPerItemList.length; i++) {

               var d105Obj = {};

               d105Obj.taxIdent = 4; //COFINS
               var cfopcode = detaillocPerItemList[i].cfopCode;
               d105Obj.cofinscstcode = detaillocPerItemList[i].COFINScstCode;
               d105Obj.cofinsbasisamount = detaillocPerItemList[i].sum_COFINS_BasisAmount;
               d105Obj.cofinspercent = detaillocPerItemList[i].COFINS_Perc;
               d105Obj.cofinsamount = detaillocPerItemList[i].sum_COFINS_Amount;
               d105Obj.indicatorNatureOfFreight = transactionObj.transacBodyFields.indicatorNatureOfFreight;

               d105Obj.accountno = '';
               d105Obj.lineamount = 0;
               var itemNo = '';
               var itemType = detaillocPerItemList[i].itemType;
               var accountLocalNo = '';

               var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                  if (Object.keys(value.itemObj).length) return (value.itemObj.id == detaillocPerItemList[i].no)
               });


               if (itemList.length > 0) {
                  itemList.map(function (item) {
                     d105Obj.lineamount += Number(item.grossAmount);
                  });

                  itemNo = itemList[0].itemObj.id;

                  if (Object.keys(itemList[0].itemObj.accountNo).length) {
                     accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                     d105Obj.accountno = accountLocalNo;
                  }
               }

               d105Obj.codeNatureBasis = getCodeNatureBasis(cfopcode, { no: itemNo, type: itemType })
               _d105List.push(d105Obj);

               fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);
            }
            return _d105List;
         }

         function fill_D110List(transactionObj, taxSettlementRec) {
            var fiscalModelCode = transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod;
            var isOutDocument = (getSourceType(transactionObj.transactionType) == 2);
            if (fiscalModelCode != '07' && !isOutDocument)
               return {}

            var _d110List = [];
            var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

            for (var i = 0; i < detaillocPerItemList.length; i++) {

               var d110Obj = {};
               d110Obj.amountinclvat = transactionObj.headerLocBodyFields.totalAmountBilled;
               d110Obj.invoicelineno = detaillocPerItemList[i].invoiceLineNo;


               d110Obj.no = '';
               d110Obj.accountno = '';

               var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                  if (Object.keys(value.itemObj).length) return value.itemObj.id == detaillocPerItemList[i].no
               });

               if (itemList.length > 0) {
                  d110Obj.no = itemList[0].itemObj.itemId;

                  if (Object.keys(itemList[0].itemObj.accountNo).length)
                     d110Obj.accountno = itemList[0].itemObj.accountNo.localNo;

               }

               fill_0200List(itemList, transactionObj, taxSettlementRec, this.objBlock.Block0._0200List);
               fill_0190List(itemList, transactionObj, this.objBlock.Block0._0190List);

               _d110List.push(d110Obj);
            }

            return _d110List;
         }

         function fill_D190List(transactionObj) {
            var _d190List = [];

            _d190List = detailLocFiltering_CST_CFOP_IcmsPerc(transactionObj);

            // for(var i = 0; i < detailLocWithFilter.length; i++){
            //     _d190List.push({
            //         cstcode: detailLocWithFilter[i].cstcode,
            //         cfopcode: detailLocWithFilter[i].cfopCode,
            //         icmspercent: detailLocWithFilter[i].icmspercent,
            //         glamount: transactionObj.headerLocBodyFields.totalAmountDiscount,
            //         icmsbasisamount: detailLocWithFilter[i].sum_ICMS_BasisAmount,
            //         icmsamount: detailLocWithFilter[i].sum_ICMS_Amount,
            //         icmsexemptamount: detailLocWithFilter[i].sum_ICMS_ExemptAmount,
            //         icmsothersamount: detailLocWithFilter[i].sum_ICMS_OthersAmount,
            //     })
            // }

            return _d190List;
         }

         function fill_D195List(transactionObj) {
            var lines = transactionObj.transacSubListFields.observationFiscalTextList.length;

            var _d195List = [];

            for (var i = 0; i < lines; i++) {

               var text = transactionObj.transacSubListFields.observationFiscalTextList[i].text;
               if (text) {
                  _d195List.push({
                     addtextcode: transactionObj.transacSubListFields.observationFiscalTextList[i].code,
                     addtextsubcode: '',
                     text: transactionObj.transacSubListFields.observationFiscalTextList[i].text,
                  });
               }
            }

            var texts = createNewTextObsFiscText(transactionObj)
            if (texts)
               _d195List = _d195List.concat(texts);

            return _d195List;
         }

         function fill_D501List(transactionObj) {

            var _d501List = [];
            var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

            for (var i = 0; i < detaillocPerItemList.length; i++) {

               var d501Obj = {};
               d501Obj.taxIdent = 3; //PIS
               var cfopcode = detaillocPerItemList[i].cfopCode;
               d501Obj.piscstcode = detaillocPerItemList[i].PIScstCode;
               d501Obj.pisbasisamount = detaillocPerItemList[i].sum_PIS_BasisAmount;
               d501Obj.pispercent = detaillocPerItemList[i].PIS_Perc;
               d501Obj.pisamount = detaillocPerItemList[i].sum_PIS_Amount;
               d501Obj.accountno = '';
               d501Obj.lineamount = 0;
               var itemNo = '';
               var itemType = detaillocPerItemList[i].itemType;
               var accountLocalNo = '';

               var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                  if (Object.keys(value.itemObj).length) return (value.itemObj.id == detaillocPerItemList[i].no)
               });


               if (itemList.length > 0) {
                  itemList.map(function (item) {
                     d501Obj.lineamount += Number(item.grossAmount);
                  });

                  itemNo = itemList[0].itemObj.id;

                  if (Object.keys(itemList[0].itemObj.accountNo).length) {
                     accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                     d501Obj.accountno = accountLocalNo;
                  }
               }

               d501Obj.codeNatureBasis = getCodeNatureBasis(cfopcode, { no: itemNo, type: itemType })
               _d501List.push(d501Obj)

               fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);

            }
            return _d501List;
         }

         function fill_D505List(transactionObj) {
            var _d505List = [];
            var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

            for (var i = 0; i < detaillocPerItemList.length; i++) {

               var d505Obj = {};

               d505Obj.taxIdent = 4; //COFINS
               var cfopcode = detaillocPerItemList[i].cfopCode;
               d505Obj.cofinscstcode = detaillocPerItemList[i].COFINScstCode;
               d505Obj.cofinsbasisamount = detaillocPerItemList[i].sum_COFINS_BasisAmount;
               d505Obj.cofinspercent = detaillocPerItemList[i].COFINS_Perc;
               d505Obj.cofinsamount = detaillocPerItemList[i].sum_COFINS_Amount;
               d505Obj.accountno = '';
               d505Obj.lineamount = 0;
               var itemNo = '';
               var itemType = detaillocPerItemList[i].itemType;
               var accountLocalNo = '';

               var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                  if (Object.keys(value.itemObj).length) return (value.itemObj.id == detaillocPerItemList[i].no)
               });


               if (itemList.length > 0) {
                  itemList.map(function (item) {
                     d505Obj.lineamount += Number(item.grossAmount);
                  });

                  itemNo = itemList[0].itemObj.id;

                  if (Object.keys(itemList[0].itemObj.accountNo).length) {
                     accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                     d505Obj.accountno = accountLocalNo;
                  }
               }

               d505Obj.codeNatureBasis = getCodeNatureBasis(cfopcode, { no: itemNo, type: itemType })
               _d505List.push(d505Obj);

               fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);

            }
            return _d505List;
         }

         function fill_D590List(transactionObj) {
            var _d590List = [];

            _d590List = detailLocFiltering_CST_CFOP_IcmsPerc(transactionObj);

            // for(var i = 0; i < detailLocWithFilter.length; i++){
            //     _d590List.push({
            //         cstcode: detailLocWithFilter[i].cstcode,
            //         cfopcode: detailLocWithFilter[i].cfopCode,
            //         icmspercent: detailLocWithFilter[i].icmspercent,
            //         glamount: transactionObj.headerLocBodyFields.totalAmountDiscount,
            //         icmsbasisamount: detailLocWithFilter[i].sum_ICMS_BasisAmount,
            //         icmsamount: detailLocWithFilter[i].sum_ICMS_Amount,
            //         icmsexemptamount: detailLocWithFilter[i].sum_ICMS_ExemptAmount,
            //         icmsothersamount: detailLocWithFilter[i].sum_ICMS_OthersAmount,
            //     })
            // }

            return _d590List;
         }

         function fill_D601List(transactionObj) {

            // if(Object.keys(itemList[i].itemObj.accountNo).length && itemList[i].itemObj.classificationItem)
            //     fill_0500List(itemList[i].itemObj.accountNo.localNo,this.objBlock.Block0._0500List);

            // if(itemList.length > 0){

            //     var classItem = itemList[0].itemObj.classificationItem;

            //     if(!classItem)
            //         return;

            //     var d601Index = _d601List.map(function(blcD601){
            //         return (blcD601.classItem == classItem);
            //     }).indexOf(true);

            //     if(d601Index < 0){
            //         var d601Obj = {};
            //         var cfopcode = detailLine.cfopCode;
            //         var itemNo = itemList[0].itemObj.id;
            //         var itemType = itemNo ? detailLine.itemType : '';

            //         d601Obj.taxIdent = 3; //PIS
            //         d601Obj.piscstcode = detailLine.cstCodePIS;
            //         d601Obj.pispercent = detailLine.perc;
            //         d601Obj.classItem = classItem;
            //         d601Obj.codeNatureBasis = getCodeNatureBasis(cfopcode,{no:itemNo,type:itemType})

            //         if(Object.keys(itemList[0].itemObj.accountNo).length){
            //             d601Obj.accountno = itemList[0].itemObj.accountNo.localNo;
            //         }

            //         itemList.map(function (item){
            //             d601Obj.lineamount += Number(item.grossAmount);
            //         });

            //         d601Obj.pisbasisamount = detailLine.base;
            //         d601Obj.pisamount = detailLine.amount;

            //         _d601List.push(d601Obj);

            //     }else{
            //         var lineamount = 0;
            //         itemList.map(function (item){
            //             lineamount += Number(item.grossAmount);
            //         });

            //         _d601List[d601Index].lineamount += lineamount;
            //         _d601List[d601Index].pisbasisamount += detailLine.base;
            //         _d601List[d601Index].pisamount += detailLine.amount;
            //     }
            // }

            var _d601List = [];
            var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

            for (var i = 0; i < detaillocPerItemList.length; i++) {

               var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                  if (Object.keys(value.itemObj).length) return (value.itemObj.id == detaillocPerItemList[i].no)
               });

               if (itemList.length > 0) {
                  var classItem = itemList[0].itemObj.classificationItem;

                  if (!classItem)
                     return _d601List;

                  var d601Obj = {};
                  d601Obj.classItem = classItem;
                  d601Obj.taxIdent = 3; //PIS
                  var cfopcode = detaillocPerItemList[i].cfopCode;
                  d601Obj.piscstcode = detaillocPerItemList[i].PIScstCode;
                  d601Obj.pisbasisamount = detaillocPerItemList[i].sum_PIS_BasisAmount;
                  d601Obj.pispercent = detaillocPerItemList[i].PIS_Perc;
                  d601Obj.pisamount = detaillocPerItemList[i].sum_PIS_Amount;
                  d601Obj.accountno = '';
                  d601Obj.lineamount = 0;
                  var itemNo = '';
                  var itemType = detaillocPerItemList[i].itemType;
                  var accountLocalNo = '';

                  itemList.map(function (item) {
                     d601Obj.lineamount += Number(item.grossAmount);
                  });

                  itemNo = itemList[0].itemObj.id;

                  if (Object.keys(itemList[0].itemObj.accountNo).length) {
                     accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                     d601Obj.accountno = accountLocalNo;
                  }

                  d601Obj.codeNatureBasis = getCodeNatureBasis(cfopcode, { no: itemNo, type: itemType })
                  _d601List.push(d601Obj)

                  fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);
               }
            }
            return _d601List;
         }

         function fill_D605List(transactionObj) {

            // var itemList = transactionObj.transacSubListFields.itemList.filter(function(value){
            //     if(Object.keys(value.itemObj).length) return (value.itemObj.id == detailLine.itemNo)
            // });

            // if(itemList.length > 0){

            //     var classItem = itemList[0].itemObj.classificationItem;

            //     if(!classItem)
            //         return;

            //     var d605Index = _d605List.map(function(blcD605){
            //         return (blcD605.classItem == classItem);
            //     }).indexOf(true);

            //     if(d605Index < 0){
            //         var d605Obj = {};
            //         var cfopcode = detailLine.cfopCode;
            //         var itemNo = itemList[0].itemObj.id;
            //         var itemType = itemNo ? detailLine.itemType : '';

            //         d605Obj.taxIdent = 4; //COFINS
            //         d605Obj.cofinscstcode = detailLine.cstCodeCOFINS;
            //         d605Obj.cofinspercent = detailLine.perc;
            //         d605Obj.classItem = classItem;
            //         d605Obj.codeNatureBasis = getCodeNatureBasis(cfopcode,{no:itemNo,type:itemType})

            //         if(Object.keys(itemList[0].itemObj.accountNo).length){
            //             d605Obj.accountno = itemList[0].itemObj.accountNo.localNo;
            //         }

            //         itemList.map(function (item){
            //             d605Obj.lineamount += Number(item.grossAmount);
            //         });

            //         d605Obj.cofinsbasisamount = detailLine.base;
            //         d605Obj.cofinsamount = detailLine.amount;

            //         _d605List.push(d605Obj)


            //     }else{
            //         var lineamount = 0;
            //         itemList.map(function (item){
            //             lineamount += Number(item.grossAmount);
            //         });

            //         _d605List[d605Index].lineamount += lineamount;
            //         _d605List[d605Index].cofinsbasisamount += detailLine.base;
            //         _d605List[d605Index].cofinsamount += detailLine.amount;
            //     }
            // }

            var _d605List = [];
            var detaillocPerItemList = sumFieldsOfDetailloc_PerItem(transactionObj.headerlocSublistFields.detaillocList);

            for (var i = 0; i < detaillocPerItemList.length; i++) {

               var itemList = transactionObj.transacSubListFields.itemList.filter(function (value) {
                  if (Object.keys(value.itemObj).length) return (value.itemObj.id == detaillocPerItemList[i].no)
               });

               if (itemList.length > 0) {
                  var classItem = itemList[0].itemObj.classificationItem;

                  if (!classItem)
                     return _d605List;

                  var d605Obj = {};
                  d605Obj.classItem = classItem;
                  d605Obj.taxIdent = 4; //COFINS
                  var cfopcode = detaillocPerItemList[i].cfopCode;
                  d605Obj.cofinscstcode = detaillocPerItemList[i].COFINScstCode;
                  d605Obj.cofinsbasisamount = detaillocPerItemList[i].sum_COFINS_BasisAmount;
                  d605Obj.cofinspercent = detaillocPerItemList[i].COFINS_Perc;
                  d605Obj.cofinsamount = detaillocPerItemList[i].sum_COFINS_Amount;
                  d605Obj.accountno = '';
                  d605Obj.lineamount = 0;
                  var itemNo = '';
                  var itemType = detaillocPerItemList[i].itemType;
                  var accountLocalNo = '';

                  itemList.map(function (item) {
                     d605Obj.lineamount += Number(item.grossAmount);
                  });

                  itemNo = itemList[0].itemObj.id;

                  if (Object.keys(itemList[0].itemObj.accountNo).length) {
                     accountLocalNo = itemList[0].itemObj.accountNo.localNo;
                     d605Obj.accountno = accountLocalNo;
                  }

                  d605Obj.codeNatureBasis = getCodeNatureBasis(cfopcode, { no: itemNo, type: itemType })
                  _d605List.push(d605Obj)

                  fill_0500List(accountLocalNo, this.objBlock.Block0._0500List);
               }
            }
            return _d605List;
         }

         function fill_D696List(transactionObj) {
            var _d696List = [];

            _d696List = detailLocFiltering_CST_CFOP_IcmsPerc(transactionObj);

            return _d696List;
         }





         function fill_E115List(detailLine, blockE) {
            if (detailLine.taxIdent == 2 && detailLine.fiscalBenefitCode) {//ICMS
               var detailIcmsObj = {
                  branchCode: detailLine.branchCode || '',
                  fiscalBenefitCode: detailLine.fiscalBenefitCode || '',
                  postingDate: detailLine.postingDate || '',
                  documentType: detailLine.documentType || '',
                  sourceType: detailLine.sourceType || '',
                  externalDocNo: detailLine.externalDocNo || '',
                  invoiceLineNo: detailLine.invoiceLineNo || '',
                  base: detailLine.base || 0,
                  amount: detailLine.amount || 0,
                  baseDeclarotory: (Number(detailLine.base) + Number(detailLine.othersBasisAmount) + Number(detailLine.exemptAmount)).toFixed(2) || 0,
                  percDeclaratory: detailLine.percDeclaratory || 0,
                  amountDeclarotory: ((Number(detailLine.base) + Number(detailLine.othersBasisAmount)) + (detailLine.exemptAmount / 100)).toFixed(2) || 0
               }
               blockE._e115List.push(detailIcmsObj)
            }
         }

         function fill_E210List(detailLine, blockE) {
            if (detailLine.taxIdent == 15) {//ST

               var returnStAmount = 0;
               var compensationStAmount = 0;
               var retentionStAmount = 0;
               var icmsStOtherCredits = 0;

               if (['1410', '1411', '1414', '1415', '1660', '1661', '1662', '2410', '2411', '2414', '2415', '2660', '2661', '2662'].indexOf(detailLine.cfopCode) >= 0)
                  returnStAmount = Number(detailLine.amount);

               if (['1603', '2603'].indexOf(detailLine.cfopCode) >= 0)
                  compensationStAmount = Number(detailLine.amount);

               if (detailLine.cfopCode.substr(0, 1) == '5' || detailLine.cfopCode.substr(0, 1) == '6')
                  retentionStAmount = Number(detailLine.amount);

               if (['1', '2'].indexOf(detailLine.cfopCode.substr(0, 1)) >= 0 &&
                  (['1410', '1411', '1414', '1415', '1660', '1661', '1662', '2410', '2411', '2414', '2415', '2660', '2661', '2662'].indexOf(detailLine.cfopCode) < 0))
                  icmsStOtherCredits = Number(detailLine.amount);


               var detailSTObj = {
                  territoryCode: blockE.territoryCode || '',
                  returnStAmount: returnStAmount || 0,
                  compensationStAmount: compensationStAmount || 0,
                  retentionStAmount: retentionStAmount || 0,
                  icmsStOtherCredits: icmsStOtherCredits || 0,
                  indMovDifal: 2
               };

               blockE._e200Obj._e210List.push(detailSTObj);

               var _e310Obj = {
                  territoryCode: blockE.territoryCode || '',
                  amountDebitFCP: 0,
                  amountDebitFcpRem: 0,
                  amountCreditFcpEmit: 0,

                  amountCreditFCP: 0,
                  amountCreditFcpRem: 0,
                  amountDebitFcpEmit: 0,
                  indMovDifal: 1
               };

               blockE._e300Obj._e310List.push(_e310Obj)
            }
         }

         function fill_E310List(detailLine, blockE) {

            if (detailLine.taxIdent == 14) {//Dif. Aliq
               if ((!detailLine.difPerc && detailLine.sourceType == 1) || detailLine.sourceType == 2) {

                  var detailAddresseeObj = {
                     territoryCode: blockE.territoryCode || '',
                     amountDebitFCP: blockE.fiscalType == 2 ? Number(detailLine.amountFCP) : 0,
                     amountDebitFcpRem: blockE.fiscalType == 2 ? Number(detailLine.addresseShareICMS) : 0,
                     amountDebitFcpEmit: 0,

                     amountCreditFCP: blockE.fiscalType == 1 ? Number(detailLine.amountFCP) : 0,
                     amountCreditFcpRem: blockE.fiscalType == 1 ? Number(detailLine.addresseShareICMS) : 0,
                     amountCreditFcpEmit: 0,
                     indMovDifal: 2
                  };
                  blockE._e300Obj._e310List.push(detailAddresseeObj)

                  var _e210Obj = {
                     territoryCode: blockE.territoryCode || '',
                     returnStAmount: 0,
                     compensationStAmount: 0,
                     retentionStAmount: 0,
                     icmsStOtherCredits: 0,
                     indMovDifal: 1
                  };

                  blockE._e200Obj._e210List.push(_e210Obj);

                  var detailShipperObj = {
                     territoryCode: blockE.branchCode.territoryCode.id || '',
                     amountDebitFCP: 0,
                     amountDebitFcpRem: 0,
                     amountDebitFcpEmit: blockE.fiscalType == 2 ? Number(detailLine.shipperShareICMS) : 0,

                     amountCreditFCP: 0,
                     amountCreditFcpRem: 0,
                     amountCreditFcpEmit: blockE.fiscalType == 1 ? Number(detailLine.shipperShareICMS) : 0,
                     indMovDifal: 2
                  };

                  blockE._e300Obj._e310List.push(detailShipperObj);

                  var _e210Obj = {
                     territoryCode: blockE.branchCode.territoryCode.id || '',
                     returnStAmount: 0,
                     compensationStAmount: 0,
                     retentionStAmount: 0,
                     icmsStOtherCredits: 0,
                     indMovDifal: 1
                  };

                  blockE._e200Obj._e210List.push(_e210Obj);
               }
            }
         }

         function fill_E510List(detailLine, blockE) {
            if (detailLine.taxIdent == 1) {
               var detailIpiObj = {
                  cfopCode: detailLine.cfopCode || '',
                  cstCode: detailLine.cstCodeIPI,
                  fiscalType: blockE.fiscalType,
                  IPIBasisAmount: Number(detailLine.base) || 0,
                  IPIexemptBasisAmount: Number(detailLine.exemptAmount) || 0,
                  IPIotherBasisAmount: Number(detailLine.othersBasisAmount) || 0,
                  IPIamount: Number(detailLine.amount) || 0,
                  glamount: 0,
                  lineLocInvoiceLineNo: []
               }

               if (!(detailIpiObj.lineLocInvoiceLineNo.indexOf(detailLine.invoiceLineNo) >= 0) && blockE.complementaryInv != '2') {// Complementary ICMS Inv.

                  detailIpiObj.lineLocInvoiceLineNo.push(detailLine.invoiceLineNo);

                  var lineIdx = blockE.linelocList.map(function (lineLoc) {
                     return (lineLoc.lineNo == detailLine.invoiceLineNo)
                  }).indexOf(true);

                  if (lineIdx >= 0)
                     detailIpiObj.glamount += Number(blockE.linelocList[lineIdx].totalAmountDisconted);

                  // aqui
                  // // sum Amt. With Incl. Tax from charge lines
                  // var chargeIdx = blockE.linelocList.map(function (lineLoc) {
                  //    return (lineLoc.relationchargeitemlineno == blockE.linelocList[lineIdx].lineNo)
                  // }).indexOf(true);

                  // if (chargeIdx >= 0)
                  //    detailIpiObj.glamount += Number(blockE.linelocList[chargeIdx].totalAmountDisconted);
               }

               blockE._e510List.push(detailIpiObj)
            }
         }
      }
      function checkTaxSituation(transactionObj) {
         var taxSituation = '';

         if (transactionObj.transacBodyFields.creditOrReturn == 2) {
            taxSituation = '02';
         } else {
            if (!transactionObj.transacBodyFields.compInvType)
               taxSituation = '00';
            else
               taxSituation = '06';

            if (transactionObj.transacBodyFields.compInvType == 6)
               taxSituation = '08';

            if (transactionObj.transacBodyFields.fiscalDocTypeObj.separatenfe ||
               transactionObj.transacBodyFields.operationTypeObj.transficmsamount)
               taxSituation = '08';

            if (transactionObj.transacBodyFields.nfeProcessObj.invoiceReason) {
               if (transactionObj.transacBodyFields.nfeProcessObj.invoiceReason == 6)
                  taxSituation = '04';
               if (transactionObj.transacBodyFields.nfeProcessObj.invoiceReason == 5)
                  taxSituation = '05';
            }

         }

         return taxSituation;
      }
      function sumFieldsOfDetailloc_PerItem(detaillocList) {
         var itensList = [];

         detaillocList.map(function (detLine, detIndex) {

            var detailItemNo = detLine.itemNo;


            if (detailItemNo) {
               var itensIndex = itensList.map(function (item) {
                  return (item.no == detailItemNo);
               }).indexOf(true);

               if (itensIndex >= 0) {
                  FillAndSumObjectFilteringTaxIdent(itensIndex, detIndex);
                  itensList[itensIndex].sum_ExemptionICMS += detLine.exemptionICMS;

               } else {

                  var objItem = {
                     no: detLine.itemNo,
                     description: detLine.itemText,
                     cstCodeICMS: detLine.cstCodeICMS,
                     cfopCode: detLine.cfopCode,
                     cfopSequentialCode: detLine.cfopSequentialCode,
                     cfopDesc: detLine.cfopDesc,
                     invoiceLineNo: detLine.invoiceLineNo,
                     lineQuantity: detLine.lineQuantity,
                     itemType: detLine.itemType,
                     sum_ExemptionICMS: detLine.exemptionICMS,
                     sum_ICMS_BasisAmount: 0,
                     sum_ICMS_Amount: 0,
                     ICMS_Perc: 0,
                     ICMScstCode: 0,
                     sum_ST_ICMSbasisAmount: 0,
                     sum_ST_ICMSamount: 0,
                     ST_Perc: 0,
                     IPIcstCode: 0,
                     sum_IPI_BasisAmount: 0,
                     sum_IPI_Amount: 0,
                     IPI_Perc: 0,
                     PIScstCode: 0,
                     sum_PIS_BasisAmount: 0,
                     sum_PIS_Amount: 0,
                     PIS_Perc: 0,
                     COFINScstCode: 0,
                     sum_COFINS_BasisAmount: 0,
                     sum_COFINS_Amount: 0,
                     COFINS_Perc: 0,
                     sum_ExemptionICMS: 0,
                     sum_ISS_BasisAmount: 0,
                     sum_ISS_Amount: 0,
                     ISS_Perc: 0,
                  }

                  var lengthArray = itensList.push(objItem);
                  var itensIndex = lengthArray - 1;

                  FillAndSumObjectFilteringTaxIdent(itensIndex, detIndex);
               }
            }

         });

         return itensList;




         function FillAndSumObjectFilteringTaxIdent(itensIndex, detIndex) {
            var taxIdent = detaillocList[detIndex].taxIdent;
            switch (taxIdent) {
               case '2':
                  itensList[itensIndex].sum_ICMS_BasisAmount += detaillocList[detIndex].base;
                  itensList[itensIndex].sum_ICMS_Amount += detaillocList[detIndex].amount;
                  itensList[itensIndex].ICMS_Perc = detaillocList[detIndex].perc;
                  itensList[itensIndex].ICMScstCode = detaillocList[detIndex].cstCodeICMS;
                  break;
               case '15':
                  itensList[itensIndex].sum_ST_ICMSbasisAmount += detaillocList[detIndex].base;
                  itensList[itensIndex].sum_ST_ICMSamount += detaillocList[detIndex].amount;
                  itensList[itensIndex].ST_Perc = detaillocList[detIndex].perc;

                  break;
               case '1':
                  itensList[itensIndex].sum_IPI_BasisAmount += detaillocList[detIndex].base;
                  itensList[itensIndex].sum_IPI_Amount += detaillocList[detIndex].amount;
                  itensList[itensIndex].IPI_Perc = detaillocList[detIndex].perc;
                  itensList[itensIndex].IPIcstCode = detaillocList[detIndex].cstCodeIPI;
                  break;
               case '3':
                  itensList[itensIndex].sum_PIS_BasisAmount += detaillocList[detIndex].base;
                  itensList[itensIndex].sum_PIS_Amount += detaillocList[detIndex].amount;
                  itensList[itensIndex].PIS_Perc = detaillocList[detIndex].perc;
                  itensList[itensIndex].PIScstCode = detaillocList[detIndex].cstCodePIS;
                  break;
               case '4':
                  itensList[itensIndex].sum_COFINS_BasisAmount += detaillocList[detIndex].base;
                  itensList[itensIndex].sum_COFINS_Amount += detaillocList[detIndex].amount;
                  itensList[itensIndex].COFINS_Perc = detaillocList[detIndex].perc;
                  itensList[itensIndex].COFINScstCode = detaillocList[detIndex].cstCodeCOFINS;

                  break;
               case '8':
                  itensList[itensIndex].sum_ISS_BasisAmount += detaillocList[detIndex].base;
                  itensList[itensIndex].sum_ISS_Amount += detaillocList[detIndex].amount;
                  itensList[itensIndex].ISS_Perc = detaillocList[detIndex].perc;

                  break;
               default:
                  break;
            }
         }
      }
      function getCodeNatureBasis(cfopcode, itemObj) {
         var codeNatureBasis = '';

         if (cfopcode) {
            var cfopCodeSearch = search.create({
               type: 'customrecord_mts_cfopcodes',
               filters: [
                  ['custrecord_mts_fiscalcode_cfopcodes', 'is', cfopcode]
               ],
               columns: [
                  'custrecord_mts_codebasecalc_cfopcodes'
               ]
            });
            var codeNatureBasis = ''
            var resultCount = cfopCodeSearch.runPaged().count;
            if (resultCount) {
               cfopCodeSearch.run().each(function (result) {
                  var natureBasis = result.getText({ name: 'custrecord_mts_codebasecalc_cfopcodes' })
                  if (natureBasis)
                     codeNatureBasis = natureBasis.substr(0, 2);

                  return false;
               })
            }
         }

         if (Object.keys(itemObj).length && !codeNatureBasis) {

            if (itemObj.type == 'Service') {

               var itemLookupFields = search.lookupFields({
                  type: 'serviceitem',
                  id: itemObj.no,
                  columns: [
                     'custitem_mts_codebasecalc'
                  ]
               });
               if (itemLookupFields.custitem_mts_codebasecalc && itemLookupFields.custitem_mts_codebasecalc.length > 0)
                  codeNatureBasis = itemLookupFields.custitem_mts_codebasecalc[0].text.substr(0, 2);
            }

            if (itemObj.type == 'NonInvtPart') {

               var itemLookupFields = search.lookupFields({
                  type: 'noninventoryitem',
                  id: itemObj.no,
                  columns: [
                     'custitem_mts_codebasecalc'
                  ]
               });
               if (itemLookupFields.custitem_mts_codebasecalc && itemLookupFields.custitem_mts_codebasecalc.length > 0)
                  codeNatureBasis = itemLookupFields.custitem_mts_codebasecalc[0].text.substr(0, 2);
            }
         }
         return codeNatureBasis;
      }
      function getSpedAccount(accountLocalNo) {
         if (!accountLocalNo)
            return '';

         var accountSearch = search.create({
            type: 'customrecord_mts_spedaccount',
            filters:
               [
                  ["custrecord_mts_no_spedaccount", "is", accountLocalNo]
               ],
            columns:
               [
                  "custrecord_mts_inclusiondate_spedaccount",
                  "custrecord_mts_no_spedaccount",
                  "custrecord_mts_name_spedaccount",
                  "custrecord_mts_accounttype_spedaccount",
                  "custrecord_mts_nivel_spedaccount"
               ]
         });

         var accountObj = {}
         var resultCount = accountSearch.runPaged().count;
         if (resultCount) {
            accountSearch.run().each(function (result) {
               accountObj.inclusionDate = result.getValue({ name: 'custrecord_mts_inclusiondate_spedaccount' });
               accountObj.accountType = result.getValue({ name: 'custrecord_mts_accounttype_spedaccount' });
               accountObj.number = result.getValue({ name: 'custrecord_mts_no_spedaccount' });
               accountObj.name = result.getValue({ name: 'custrecord_mts_name_spedaccount' });
               accountObj.indentation = result.getValue({ name: 'custrecord_mts_indentation_spedaccount' });
               accountObj.nivel = result.getValue({ name: 'custrecord_mts_nivel_spedaccount' });

               return false;
            });
         }

         return accountObj;
      }
      function detailLocFiltering_CST_CFOP_IcmsPerc(transactionObj) {
         var detailFilterList = [];
         var tranBodyObj = transactionObj.transacBodyFields;
         var detaillocList = transactionObj.headerlocSublistFields.detaillocList;
         var linelocList = transactionObj.headerlocSublistFields.linelocList;

         var detaillocListFiltered = detaillocList.filter(function (detailLoc) {
            return (detailLoc.taxIdent == '2')// icms
         });

         if (detaillocListFiltered.length) {
            detaillocListFiltered.map(function (detLine, detIndex) {

               var detailCST = detLine.cstCodeICMS || '';
               var detailCFOP = detLine.cfopCode || '';
               var detailICMSPerc = detLine.perc || 0;

               var index = detailFilterList.map(function (elem) {
                  return (elem.cstcode == detailCST && elem.cfopcode == detailCFOP && elem.icmspercent == detailICMSPerc);
               }).indexOf(true);

               if (index >= 0) {
                  FillAndSumObjectFilteringTaxIdent(index, detIndex, detailFilterList);
               } else {

                  var detailObj = {
                     cstcode: detailCST,
                     cfopcode: detailCFOP,
                     glamount: 0,
                     lineLocInvoiceLineNo: [],
                     icmspercent: detailICMSPerc,
                     icmsexemptamount: 0,
                     icmsbasisamount: 0,
                     icmsothersamount: 0,
                     icmsamount: 0,
                     icmsstbasis: 0,
                     icmsstamount: 0,
                     ipiamount: 0,
                     vlfcpop: 0,
                     vlfcpst: 0,
                     vlfcpret: 0,
                  }

                  var lengthArray = detailFilterList.push(detailObj);
                  var index = lengthArray - 1;

                  FillAndSumObjectFilteringTaxIdent(index, detIndex);

               }
            });
         } else {
            var detailObj = {};

            // sum IPI amounts
            var taxTotalIPIObj = sumTaxAmountByFilters('1', '');
            if (Object.keys(taxTotalIPIObj).length) {
               detailObj.ipiamount += Number(taxTotalIPIObj.amount);
            }

            // sum ST amounts
            var taxTotalSTObj = sumTaxAmountByFilters('15', '');
            if (Object.keys(taxTotalSTObj).length) {
               detailObj.icmsstbasis += Number(taxTotalSTObj.base);
               detailObj.icmsstamount += Number(taxTotalSTObj.amount);
               detailObj.vlfcpst += Number(taxTotalSTObj.fcpAmountST);
               detailObj.vlfcpret += Number(taxTotalSTObj.fcpAmountRet);
            }


            if (Object.keys(detailObj).length) {
               detailObj.cstcode = '';
               detailObj.icmspercent = 0;
               detailObj.icmsexemptamount = 0;
               detailObj.icmsothersamount = 0,
                  detailObj.icmsbasisamount = 0;
               detailObj.icmsamount = 0;
               detailObj.vlfcpop = 0;

               detailFilterList.push(detailObj);
            }
         }

         return detailFilterList;




         function FillAndSumObjectFilteringTaxIdent(index, detIndex) {
            if (!(detailFilterList[index].lineLocInvoiceLineNo.indexOf(detaillocListFiltered[detIndex].invoiceLineNo) >= 0) &&
               tranBodyObj.compInvType != '2' && detaillocListFiltered[detIndex].itemType != 'OthCharge'
            ) { // Complementary ICMS Inv.

               detailFilterList[index].lineLocInvoiceLineNo.push(detaillocListFiltered[detIndex].invoiceLineNo);

               // find lineLoc referenced to detailLoc
               var lineLocList_Item = linelocList.filter(function (lineLoc) {
                  return (lineLoc.lineNo == detaillocListFiltered[detIndex].invoiceLineNo)
               });

               lineLocList_Item.map(function (lineLocItem) {
                  detailFilterList[index].glamount += Number(lineLocItem.totalAmountDisconted);

                  // sum Amt. With Incl. Tax from charge lines
                  var lineLocList_Charges = linelocList.filter(function (lineLoc) {
                     return (lineLoc.relationchargeitemlineno == lineLocItem.lineNo)
                  });
                  lineLocList_Charges.map(function (lineLocCharge) {
                     detailFilterList[index].glamount += Number(lineLocCharge.totalAmountDisconted);
                  });
               });
            }

            // sum ICMS amounts
            detailFilterList[index].icmsbasisamount += Number(detaillocListFiltered[detIndex].base);
            detailFilterList[index].icmsamount += Number(detaillocListFiltered[detIndex].amount);
            detailFilterList[index].vlfcpop += Number(detaillocListFiltered[detIndex].amountFCP);
            detailFilterList[index].icmsexemptamount += Number(detaillocListFiltered[detIndex].exemptAmount);
            detailFilterList[index].icmsothersamount += Number(detaillocListFiltered[detIndex].othersBasisAmount);

            // sum IPI amounts
            var taxTotalObj = sumTaxAmountByFilters('1', detaillocListFiltered[detIndex].invoiceLineNo);
            if (Object.keys(taxTotalObj).length) {
               detailFilterList[index].ipiamount += Number(taxTotalObj.amount);
            }


            // sum ST amounts
            var taxTotalObj = sumTaxAmountByFilters('15', detaillocListFiltered[detIndex].invoiceLineNo);
            if (Object.keys(taxTotalObj).length) {
               detailFilterList[index].icmsstbasis += Number(taxTotalObj.base);
               detailFilterList[index].icmsstamount += Number(taxTotalObj.amount);
               detailFilterList[index].vlfcpst += Number(taxTotalObj.fcpAmountST);
               detailFilterList[index].vlfcpret += Number(taxTotalObj.fcpAmountRet);
            }
         }

         function sumTaxAmountByFilters(taxIdentFilter, lineNoFilter) {
            var taxTotalObj = {
               cfopcode: '',
               amount: 0,
               base: 0,
               fcpAmountST: 0,
               fcpAmountRet: 0,
               glamount: 0,
               lineLocInvoiceLineNo: []
            };

            if (!taxIdentFilter && !lineNoFilter)
               return taxTotalObj;

            var detailLocFiltered = detaillocList.filter(function (detailLoc) {
               if (lineNoFilter)
                  return (detailLoc.taxIdent == taxIdentFilter && detailLoc.invoiceLineNo == lineNoFilter);
               else
                  return (detailLoc.taxIdent == taxIdentFilter);
            });

            if (!detailLocFiltered.length)
               return {};

            detailLocFiltered.map(function (detLine, detIndex) {
               taxTotalObj.cfopcode = detLine.cfopCode;
               taxTotalObj.amount += Number(detLine.amount);
               taxTotalObj.base += Number(detLine.base);

               var cstCode = detLine.cstCodeICMS.substr(1, 2);
               if (cstCode == '10' || cstCode == '30' || cstCode == '70') {
                  taxTotalObj.fcpAmountST += Number(detLine.amount);
               } else if (cstCode == '60') {
                  taxTotalObj.fcpAmountRet += Number(detLine.amount);
               }

               if (!(taxTotalObj.lineLocInvoiceLineNo.indexOf(detLine.invoiceLineNo) >= 0) &&
                  tranBodyObj.compInvType != '2' && detLine.itemType != 'OthCharge'
               ) { // Complementary ICMS Inv.

                  taxTotalObj.lineLocInvoiceLineNo.push(detLine.invoiceLineNo);

                  var lineLocList_Item = linelocList.filter(function (lineLoc) {
                     return (lineLoc.lineNo == detLine.invoiceLineNo)
                  });

                  lineLocList_Item.map(function (lineLocItem) {
                     taxTotalObj.glamount += Number(lineLocItem.totalAmountDisconted);

                     // sum Amt. With Incl. Tax from charge lines
                     var lineLocList_Charges = linelocList.filter(function (lineLoc) {
                        return (lineLoc.relationchargeitemlineno == lineLocItem.lineNo)
                     });
                     lineLocList_Charges.map(function (lineLocCharge) {
                        taxTotalObj.glamount += Number(lineLocCharge.totalAmountDisconted);
                     });
                  });
               }
            })
            return taxTotalObj;
         }
      }
      function createNewTextObsFiscText(transactionObj) {
         var obsText = [];

         if (transactionObj.transacBodyFields.operationTypeObj.transficmsamount)
            appendObsText('Transf. Saldo (Devedor/Credor) - Art. 98 do RICMS', obsText);

         var text = '';
         if (transactionObj.transacBodyFields.creditOrReturn == '2') {    // nota cancelada
            text = 'NF Cancelada';
         } else if (transactionObj.transacBodyFields.nfeProcessObj.invoiceReason == '5') {
            text = transactionObj.transacBodyFields.nfeProcessObj.returnCodeObj.bookObservation;
         } else if (transactionObj.transacBodyFields.tranType == 'creditmemo' && transactionObj.transacBodyFields.postingType == '1') {    // nota de devolução
            transactionObj.transacSubListFields.itemList.map(function (tranLine) {
               if (Object.keys(tranLine.documentReferenceObj).length) {
                  if (tranLine.documentReferenceObj.externalDocumentNo) {
                     var textAux = tranLine.documentReferenceObj.externalDocumentNo + '-' + tranLine.documentReferenceObj.tranDate;
                     if (text)
                        text += ';' + textAux
                     else
                        text = textAux;
                  }
               }
            });

            if (text)
               text = 'NFs Dev: ' + text;
            else
               text = 'Devolução';
         }
         appendObsText(text, obsText);

         var text = '';
         var compInvType = transactionObj.transacBodyFields.compInvType;
         switch (compInvType) {
            case '1':
               text += 'NF Comp.IPI NF ' + transactionObj.transacBodyFields.invToComp;
               break;
            case '2':
               text += 'NF Comp.ICMS NF ' + transactionObj.transacBodyFields.invToComp;
               break;
            case '3':
               text += 'NF Comp.IPI/ICMS NF ' + transactionObj.transacBodyFields.invToComp;
               break;
            case '4':
               text += 'NF Comp.Preço NF ' + transactionObj.transacBodyFields.invToComp;
               break;
            case '5':
               text += 'NF Comp.ICMS DIF ST NF ' + transactionObj.transacBodyFields.invToComp;
               break;
            case '6':
               text += 'Lancto credito ativo NF ' + transactionObj.transacBodyFields.invToComp;
               break;
            default:
               break;
         }
         appendObsText(text, obsText);

         if (transactionObj.transacBodyFields.endUser)
            appendObsText('Consum.final', obsText);

         var text = '';
         if (Object.keys(transactionObj.headerlocSublistFields).length) {
            if (transactionObj.headerlocSublistFields.detaillocList.length > 0 && transactionObj.headerlocSublistFields.detaillocList[0].brLineDiscAmount) {
               text += 'Desc. Incond. NF ' +
                  transactionObj.headerlocSublistFields.detaillocList[0].externalDocNo + ' ' +
                  transactionObj.headerlocSublistFields.detaillocList[0].brLineDiscAmount;
            }
         }
         appendObsText(text, obsText);

         return obsText;
      }
      function appendObsText(text, obsTexts) {
         if (!text)
            return;

         // check if exist
         indx = defaultObsFiscalTexts.map(function (e) {
            if (Object.keys(e).length) {
               return (e.text.toUpperCase() == text.toUpperCase())
            }
            return false;
         }).indexOf(true);

         var obsTextCode = '';
         if (indx >= 0) {      // exist
            obsTextCode = defaultObsFiscalTexts[indx].addtextcode;
         } else {      // not exist
            obsTextCode = sumLastCode(lastObsFiscalCode);

            defaultObsFiscalTexts.push({
               addtextcode: obsTextCode,
               addtextsubcode: '',
               text: text
            });
         }

         obsTexts.push({
            addtextcode: obsTextCode,
            addtextsubcode: '',
            text: text
         });
      }
      function getTaxSettlement(taxSettid) {
         var taxSettRec = '';
         if (taxSettid)
            var taxSettRec = record.load({
               type: 'customrecord_mts_taxsettlem',
               id: taxSettid,
               isDynamic: true
            });

         return taxSettRec;
      }
      function getTaxSettlementObj(taxSettid) {
         if (!taxSettid)
            return { id: '' };

         var taxSettLookUp = search.lookupFields({
            type: 'customrecord_mts_taxsettlem',
            id: taxSettid,
            columns: [
               'name',
               'custrecord_mts_startdate_taxsettlem',
               'custrecord_mts_enddate_taxsettlem',
               'custrecord_mts_generateefdpis_taxsettlem',
               'custrecord_mts_subsidiary_taxsettlem',
               'custrecord_mts_branchcode_taxsettlem',
               'custrecord_mts_dtstoproc_taxsettlem_tmp',
               'custrecord_mts_generblck_taxsettlem_tmp',
               'custrecord_mts_inventorydate_taxsettlem'
            ]
         });

         taxSettObj = {};
         taxSettObj.id = taxSettid;
         taxSettObj.name = taxSettLookUp.name;
         taxSettObj.isGenerateEfdPisCofins = taxSettLookUp.custrecord_mts_generateefdpis_taxsettlem;
         taxSettObj.datesToProcess = taxSettLookUp.custrecord_mts_dtstoproc_taxsettlem_tmp;
         taxSettObj.generateBlockK = taxSettLookUp.custrecord_mts_generblck_taxsettlem_tmp;
         taxSettObj.inventoryDate = taxSettLookUp.custrecord_mts_inventorydate_taxsettlem;

         taxSettObj.startDate = '';
         if (taxSettLookUp.custrecord_mts_startdate_taxsettlem)
            taxSettObj.startDate = format.parse({
               value: taxSettLookUp.custrecord_mts_startdate_taxsettlem,
               type: format.Type.DATE
            });

         taxSettObj.endDate = '';
         if (taxSettLookUp.custrecord_mts_enddate_taxsettlem)
            taxSettObj.endDate = format.parse({
               value: taxSettLookUp.custrecord_mts_enddate_taxsettlem,
               type: format.Type.DATE
            });

         taxSettObj.subsidiaryId = '';
         if (taxSettLookUp.custrecord_mts_subsidiary_taxsettlem.length)
            taxSettObj.subsidiaryId = taxSettLookUp.custrecord_mts_subsidiary_taxsettlem[0].value

         taxSettObj.branchId = '';
         if (taxSettLookUp.custrecord_mts_branchcode_taxsettlem.length)
            taxSettObj.branchId = taxSettLookUp.custrecord_mts_branchcode_taxsettlem[0].value

         return taxSettObj;
      }
      function getBranchInformation(branchInfoId) {
         if (!branchInfoId)
            return {};

         var branchInfoLookup = search.lookupFields({
            type: 'customrecord_mts_branchinfo',
            id: branchInfoId,
            columns: [
               'internalid',
               'custrecord_mts_nfeimporttype_branchinfo',
               'custrecord_mts_territorycode_branchinfo',
               'custrecord_mts_subsidiary_branchinfo'
            ]
         });

         if (!Object.keys(branchInfoLookup).length)
            return {};

         var branchObj = {};
         branchObj.id = branchInfoId,
            branchObj.nfeImportType = '';
         if (branchInfoLookup.custrecord_mts_nfeimporttype_branchinfo.length)
            branchObj.nfeImportType = branchInfoLookup.custrecord_mts_nfeimporttype_branchinfo[0].value;
         if (branchInfoLookup.custrecord_mts_territorycode_branchinfo.length)
            branchObj.territory = getTerritory(branchInfoLookup.custrecord_mts_territorycode_branchinfo[0].value);
         if (branchInfoLookup.custrecord_mts_subsidiary_branchinfo.length)
            branchObj.subsidiary = branchInfoLookup.custrecord_mts_subsidiary_branchinfo[0].value;

         return branchObj;
      }
      function getLineAmount(transactionObj, freightAmount, insuranceAmount, otherdispanamt) {
         var lineAmount = 0;

         lineAmount = transactionObj.headerLocBodyFields.TotalAmountWithIncludedTaxes;
         lineAmount = lineAmount - (freightAmount + insuranceAmount + otherdispanamt);
         return lineAmount;
      }
      function getFreightAmount(transactionObj) {
         var freightAmount = 0;

         if (getSourceType(transactionObj.transactionType) == 1) {    //compras
            if (transactionObj.transacBodyFields.directImport && transactionObj.transacBodyFields.branchCodeObj.nfeImportType == '5') // DN_CAT_6/15
               return 0;

            transactionObj.transacSubListFields.itemList.map(function (itemLine) {
               if (Object.keys(itemLine.itemObj).length) {
                  if (itemLine.itemObj.type == 'otherchargeitem' && itemLine.itemObj.itemChargeType == '2')  //Freight
                     freightAmount += itemLine.grossAmount ? Number(itemLine.grossAmount) : 0;
               }
            });

         } else if (getSourceType(transactionObj.transactionType) == 2) {      //vendas
            transactionObj.transacSubListFields.itemList.map(function (itemLine) {
               if (Object.keys(itemLine.itemObj).length) {
                  if (itemLine.itemObj.type == 'otherchargeitem' && itemLine.itemObj.itemChargeType == '2')  //Freight
                     freightAmount += itemLine.grossAmount ? Number(itemLine.grossAmount) : 0;
               }
            });
         }

         return freightAmount;
      }
      function getInsuranceAmount(transactionObj) {
         var insuranceAmount = 0;

         if (getSourceType(transactionObj.transactionType) == 1) {       // compras
            if (transactionObj.transacBodyFields.directImport)
               return 0;
            if (transactionObj.transacBodyFields.branchCodeObj.nfeImportType == '5')     // DN_CAT_6/15
               return 0;

            transactionObj.transacSubListFields.itemList.map(function (itemLine) {
               if (Object.keys(itemLine.itemObj).length)
                  if (itemLine.itemObj.type == 'otherchargeitem' && itemLine.itemObj.itemChargeType == '1')  //insurance
                     insuranceAmount += itemLine.grossAmount ? Number(itemLine.grossAmount) : 0;
            });
         } else if (getSourceType(transactionObj.transactionType) == 2) {      //vendas
            transactionObj.transacSubListFields.itemList.map(function (itemLine) {
               if (Object.keys(itemLine.itemObj).length)
                  if (itemLine.itemObj.type == 'otherchargeitem' && itemLine.itemObj.itemChargeType == '1')  //Insurance
                     insuranceAmount += itemLine.grossAmount ? Number(itemLine.grossAmount) : 0;
            });
         }

         return insuranceAmount;
      }
      function getOtherExpensesAmount(transactionObj) {
         var othExpensesAmount = 0;

         transactionObj.transacSubListFields.itemList.map(function (itemLine) {
            if (Object.keys(itemLine.itemObj).length)
               if (itemLine.itemObj.type == 'otherchargeitem' && itemLine.itemObj.itemChargeType == '3')  //OtherExpense
                  othExpensesAmount += itemLine.grossAmount ? Number(itemLine.grossAmount) : 0;
         });

         return othExpensesAmount;
      }
      function getNFeKeyAccess(transactionObj) {
         if (!(transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod == '55' ||
            transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod == '65' ||
            transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod == '66'))
            return '';

         if (Object.keys(transactionObj.transacBodyFields.nfeProcessObj).length)
            if (transactionObj.transacBodyFields.nfeProcessObj.nfeKeyAccess)
               return transactionObj.transacBodyFields.nfeProcessObj.nfeKeyAccess;

         if (transactionObj.transacBodyFields.keyAccess)
            return transactionObj.transacBodyFields.keyAccess;

         if (transactionObj.transacBodyFields.nfeKeyAccessThirdIssue)
            return transactionObj.transacBodyFields.nfeKeyAccessThirdIssue;

         return '';
      }
      function getThirdNFeKeyAccess(transactionObj) {
         if(transactionObj.transacBodyFields.fiscalDocTypeObj.elecfilecod != '66' 
            ||  transactionObj.transacBodyFields.fiscalDocTypeObj.typeNf3e != '02' )
            return ''

         if (transactionObj.transacBodyFields.nfeKeyAccessThirdIssue)
            return transactionObj.transacBodyFields.nfeKeyAccessThirdIssue;

         return '';
      }
      function getGlamountOneAndTwo(taxIden, transactionObj) {
         switch (taxIden) {
            case 'COFINS Ret.':
               taxIden = 11;
               break;
            case 'PIS Ret.':
               taxIden = 10;
               break;
            default:
               break;
         }

         var value = 0;
         var detailLocLines = transactionObj.headerlocSublistFields.detaillocList;
         for (var i = 0; i < detailLocLines.length; i++) {
            if (detailLocLines[i].taxIdent == taxIden)
               value += (detailLocLines[i].base * (detailLocLines[i].perc / 100)).toFixed(2);
         }

         return value;
      }
      function getSourceType(transactionType) {
         if (["vendorbill", "creditmemo", "itemreceipt"].indexOf(transactionType) >= 0)
            return 1;
         else if (["invoice", "vendorcredit", "cashsale", "customsale_mts_transferinvoice_tr"].indexOf(transactionType) >= 0)
            return 2;
      }
      function getCreditTitleType(transactionObj) {
         var paymentMethodObj = transactionObj.transacBodyFields.paymentMethodObj;
         var creditTitleObj = {
            type: '',
            description: ''
         };

         switch (paymentMethodObj.creditTitleType) {
            case '1':   // Duplicata
               creditTitleObj.type = '00';
               break;
            case '2':   // Cheque
               creditTitleObj.type = '01';
               break;
            case '3':   // Promisoria
               creditTitleObj.type = '02';
               break;
            case '4':   // Recibo
               creditTitleObj.type = '03';
               break;
            default:   // opção Outros ou em branco
               creditTitleObj.type = '99';
               creditTitleObj.description = paymentMethodObj.name;
               break;
         }

         return creditTitleObj;
      }
      function updatePercentAbstract(percentAbstractObj) {
      }
      function getTariffNumber(tariffId) {
         if (!tariffId)
            return {};

         var lookupFieldTariifNumber = search.lookupFields({
            type: 'customrecord_mts_tariffnumber',
            id: tariffId,
            columns: [
               'custrecord_mts_excncmcode_tariffnumber',
               'custrecord_mts_cest_tariffnumber',
               'name'
            ]
         });

         return {
            excncmcode: lookupFieldTariifNumber.custrecord_mts_excncmcode_tariffnumber,
            cest: lookupFieldTariifNumber.custrecord_mts_cest_tariffnumber,
            id: lookupFieldTariifNumber.name
         }
      }
      function getAccountNo(accountId) {
         if (!accountId)
            return {};

         var lookupFieldAccount = search.lookupFields({
            type: 'account',
            id: accountId,
            columns: [
               'number',
               'name',
               'custrecord_mts_localno_account'
            ]
         });

         var name = lookupFieldAccount.name;
         var number = lookupFieldAccount.number;

         accountName = String(name).replace(number, '').trim();

         return {
            number: lookupFieldAccount.number,
            name: accountName,
            localNo: lookupFieldAccount.custrecord_mts_localno_account
         }
      }
      function getAccountNoFromBuffer(accountId) {
         if (!accountId)
            return {};

         var accountFiltered = Buffer.accountList.filter(function (acc) {
            return (acc.internalid == accountId)
         });
         if (accountFiltered.length) {
            return accountFiltered[0];
         } else {
            return {};
         }
      }
      function getDetailAmountsForCharge(transactionObj, filtersObj, totalizerObj) {

         var detailLocChargesList = transactionObj.headerlocSublistFields.detaillocList.filter(function (detailLocCharge) {
            return (
               detailLocCharge.itemType == 'OthCharge' &&
               detailLocCharge.relationChargeItemLineNo == filtersObj.invoiceLineNo &&
               detailLocCharge.taxIdent == filtersObj.taxIdentification //1        // IPI
            )
         });
         detailLocChargesList.map(function (detailLocCharge) {
            if (transactionObj.transacBodyFields.directImport == true) {
               totalizerObj.chargeBase += detailLocCharge.base;
               totalizerObj.chargeAmount += detailLocCharge.amount;
            }
            totalizerObj.chargeBaseOthers += detailLocCharge.othersBasisAmount;
            totalizerObj.chargeBaseExempt += detailLocCharge.exemptAmount;

            // get LineLoc amounts
            var lineLocFiltered = transactionObj.headerlocSublistFields.linelocList.filter(function (lineLoc) {
               return (lineLoc.lineNo == detailLocCharge.invoiceLineNo)
            });
            if (lineLocFiltered.length)
               totalizerObj.chargeTotalAmtDiscounted = lineLocFiltered[0].totalAmountDisconted;
         });
      }
      function detailLocFilterCFOPCode(transactionObj) {
         var detaillocList = transactionObj.headerlocSublistFields.detaillocList;
         var linelocList = transactionObj.headerlocSublistFields.linelocList;
         var CFOPList = [];
         var groupByCFOPList = [];

         //trocar por reduce
         for (var i = 0; i < detaillocList.length; i++) {

            if (CFOPList.indexOf(detaillocList[i].cfopCode) < 0) {
               CFOPList.push(detaillocList[i].cfopCode);

               var groupDetailByCFOP = detaillocList.filter(function (detailLoc) {
                  return (detailLoc.cfopCode == detaillocList[i].cfopCode)
               });

               groupByCFOPList.push({
                  cfopCode: detaillocList[i].cfopCode,
                  cfopDesc: detaillocList[i].cfopDesc,
                  detailByCFOP: groupDetailByCFOP
               });
            }
         };


         var fiscalType = '';
         var detailLocGroupList = [];

         if (
            transactionObj.transactionType == 'vendorbill' ||
            transactionObj.transactionType == 'creditmemo' ||
            transactionObj.transactionType == 'itemreceipt'
         ) {
            fiscalType = 1; // Input
         } else if (
            transactionObj.transactionType == 'invoice' ||
            transactionObj.transactionType == 'vendorcredit' ||
            transactionObj.transactionType == 'cashsale' ||
            transactionObj.transactionType == 'customsale_mts_transferinvoice_tr'
         ) {
            fiscalType = 2; // Output
         }


         for (var i = 0; i < groupByCFOPList.length; i++) {

            var fiscalValueObj = {
               cfopCode: groupByCFOPList[i].cfopCode,
               cfopDesc: groupByCFOPList[i].cfopDesc,
               fiscalType: fiscalType,
               lineLocInvoiceLineNo: [],
               icmsBasisAmount: 0,
               icmsExemptAmount: 0,
               icmsOthersAmount: 0,
               icmsAmount: 0,
               ipiBasisAmount: 0,
               ipiExemptAmount: 0,
               ipiOthersAmount: 0,
               ipiAmount: 0,
               glAmount: 0
            }

            if (transactionObj.transacBodyFields.creditOrReturn == '2') { // nota cancelada
               detailLocGroupList.push(fiscalValueObj)

            } else {

               var detailFilteredIcmsList = groupByCFOPList[i].detailByCFOP.filter(function (detailloc) {
                  return (detailloc.taxIdent == '2');
               });



               if (detailFilteredIcmsList.length) {

                  detailFilteredIcmsList.forEach(function (detailIcmsLine) {

                     if (!(fiscalValueObj.lineLocInvoiceLineNo.indexOf(detailIcmsLine.invoiceLineNo) >= 0) && detailIcmsLine.itemType != 'OthCharge') {

                        fiscalValueObj.lineLocInvoiceLineNo.push(detailIcmsLine.invoiceLineNo);

                        var lineIdx = linelocList.map(function (lineLoc) {
                           return (lineLoc.lineNo == detailIcmsLine.invoiceLineNo)
                        }).indexOf(true);

                        if (lineIdx >= 0)
                           fiscalValueObj.glAmount += Number(linelocList[lineIdx].totalAmountDisconted);

                        // sum Amt. With Incl. Tax from charge lines
                        var lineLocCharges = linelocList.filter(function (lineLoc) {
                           return (lineLoc.relationchargeitemlineno == linelocList[lineIdx].lineNo)
                        });

                        lineLocCharges.map(function (lineLocChrg) {
                           fiscalValueObj.glAmount += Number(lineLocChrg.totalAmountDisconted);
                        });

                        fiscalValueObj.icmsBasisAmount += Number(detailIcmsLine.base);
                        fiscalValueObj.icmsExemptAmount += Number(detailIcmsLine.exemptAmount);
                        fiscalValueObj.icmsOthersAmount += Number(detailIcmsLine.othersBasisAmount);
                        fiscalValueObj.icmsAmount += Number(detailIcmsLine.amount);

                        // get ICMS charge amounts
                        var detailICMSListFromCharge = detaillocList.filter(function (detail) {
                           return (
                              detail.relationChargeItemLineNo == detailIcmsLine.invoiceLineNo &&
                              detail.taxIdent == '2'      // ICMS
                           );
                        });
                        detailICMSListFromCharge.map(function (detailOfCharge) {
                           fiscalValueObj.icmsBasisAmount += Number(detailOfCharge.base);
                           fiscalValueObj.icmsExemptAmount += Number(detailOfCharge.exemptAmount);
                           fiscalValueObj.icmsOthersAmount += Number(detailOfCharge.othersBasisAmount);
                           fiscalValueObj.icmsAmount += Number(detailOfCharge.amount);
                        });

                        // IPI
                        var detailFilteredIpiAndLineNoList = detaillocList.filter(function (detailLine) {
                           return (detailLine.invoiceLineNo == detailIcmsLine.invoiceLineNo && detailLine.taxIdent == '1');
                        });

                        detailFilteredIpiAndLineNoList.forEach(function (detailIpiLine) {
                           fiscalValueObj.ipiBasisAmount += Number(detailIpiLine.base);
                           fiscalValueObj.ipiExemptAmount += Number(detailIpiLine.exemptAmount);
                           fiscalValueObj.ipiOthersAmount += Number(detailIpiLine.othersBasisAmount);
                           fiscalValueObj.ipiAmount += Number(detailIpiLine.amount);
                        });

                        // get IPI charge amounts
                        var detailIPIListFromCharge = detaillocList.filter(function (detail) {
                           return (
                              detail.relationChargeItemLineNo == detailIcmsLine.invoiceLineNo &&
                              detail.taxIdent == '1'      // IPI
                           );
                        });
                        detailIPIListFromCharge.map(function (detail) {
                           fiscalValueObj.ipiBasisAmount += Number(detail.base);
                           fiscalValueObj.ipiExemptAmount += Number(detail.exemptAmount);
                           fiscalValueObj.ipiOthersAmount += Number(detail.othersBasisAmount);
                           fiscalValueObj.ipiAmount += Number(detail.amount);
                        });
                     }
                  })

               } else {

                  var detailFilteredIpiList = groupByCFOPList[i].detailByCFOP.filter(function (detailloc) {
                     return (detailloc.taxIdent == '1');     // IPI
                  });

                  detailFilteredIpiList.forEach(function (detailIpiLine) {

                     if (!(fiscalValueObj.lineLocInvoiceLineNo.indexOf(detailIpiLine.invoiceLineNo) >= 0) && detailIpiLine.itemType != 'OthCharge') {

                        fiscalValueObj.lineLocInvoiceLineNo.push(detailIpiLine.invoiceLineNo);

                        var lineIdx = linelocList.map(function (lineLoc) {
                           return (lineLoc.lineNo == detailIpiLine.invoiceLineNo)
                        }).indexOf(true);

                        if (lineIdx >= 0)
                           fiscalValueObj.glAmount += Number(linelocList[lineIdx].totalAmountDisconted);

                        // sum Amt. With Incl. Tax from charge lines
                        var lineLocCharges = linelocList.filter(function (lineLoc) {
                           return (lineLoc.relationchargeitemlineno == linelocList[lineIdx].lineNo)
                        });

                        lineLocCharges.map(function (lineLocChrg) {
                           fiscalValueObj.glAmount += Number(lineLocChrg.totalAmountDisconted);
                        });

                        fiscalValueObj.ipiBasisAmount += Number(detailIpiLine.base);
                        fiscalValueObj.ipiExemptAmount += Number(detailIpiLine.exemptAmount);
                        fiscalValueObj.ipiOthersAmount += Number(detailIpiLine.othersBasisAmount);
                        fiscalValueObj.ipiAmount += Number(detailIpiLine.amount);

                        // get IPI charge amounts
                        var detailIPIListFromCharge = detaillocList.filter(function (detail) {
                           return (
                              detail.relationChargeItemLineNo == detailIpiLine.invoiceLineNo &&
                              detail.taxIdent == '1'      // IPI
                           );
                        });
                        detailIPIListFromCharge.map(function (detail) {
                           fiscalValueObj.ipiBasisAmount += Number(detail.base);
                           fiscalValueObj.ipiExemptAmount += Number(detail.exemptAmount);
                           fiscalValueObj.ipiOthersAmount += Number(detail.othersBasisAmount);
                           fiscalValueObj.ipiAmount += Number(detail.amount);
                        });
                     }
                  })
               }
               detailLocGroupList.push(fiscalValueObj);
            }
         }

         return detailLocGroupList;
      }
      function groupIcmsAndIpiByCfop(transactionObj) {
         var detaillocList = transactionObj.headerlocSublistFields.detaillocList;
         var linelocList = transactionObj.headerlocSublistFields.linelocList;
         var CFOPList = [];
         var groupByCFOPList = [];

         //trocar por reduce
         for (var i = 0; i < detaillocList.length; i++) {

            if (CFOPList.indexOf(detaillocList[i].cfopCode) < 0) {
               CFOPList.push(detaillocList[i].cfopCode);

               var groupDetailByCFOP = detaillocList.filter(function (detailLoc) {
                  return (detailLoc.cfopCode == detaillocList[i].cfopCode)
               });

               groupByCFOPList.push({
                  cfopCode: detaillocList[i].cfopCode,
                  cfopDesc: detaillocList[i].cfopDesc,
                  detailByCFOP: groupDetailByCFOP
               });
            }
         };


         var detailLocIcmsAndIpiList = [];

         for (var i = 0; i < groupByCFOPList.length; i++) {

            var fiscalValueObj = {
               cfopCode: groupByCFOPList[i].cfopCode,
               cfopDesc: groupByCFOPList[i].cfopDesc,
               lineLocInvoiceLineNo: [],
               icmsBasisAmount: 0,
               icmsExemptAmount: 0,
               icmsOthersAmount: 0,
               icmsAmount: 0,
               ipiBasisAmount: 0,
               ipiExemptAmount: 0,
               ipiOthersAmount: 0,
               ipiAmount: 0,
               glamount: 0,
               nonContributingBookValue: 0,
               nonTaxpayerCalculationBasis: 0,
               taxpayerBookValue: 0,
               taxpayerCalculationBasis: 0
            }

            if (transactionObj.transacBodyFields.creditOrReturn == '2') { // nota cancelada
               detailLocIcmsAndIpiList.push(fiscalValueObj)

            } else {

               var detailFilteredIcmsList = groupByCFOPList[i].detailByCFOP.filter(function (detailloc) {
                  return (detailloc.taxIdent == '2');
               });

               if (detailFilteredIcmsList.length) {
                  detailFilteredIcmsList.forEach(function (detailIcmsLine) {

                     if (!(fiscalValueObj.lineLocInvoiceLineNo.indexOf(detailIcmsLine.invoiceLineNo) >= 0) && detailIcmsLine.itemType != 'OthCharge') {

                        var glAmountAux = 0;

                        fiscalValueObj.lineLocInvoiceLineNo.push(detailIcmsLine.invoiceLineNo);

                        var lineIdx = linelocList.map(function (lineLoc) {
                           return (lineLoc.lineNo == detailIcmsLine.invoiceLineNo)
                        }).indexOf(true);

                        if (lineIdx >= 0) {
                           fiscalValueObj.glamount += Number(linelocList[lineIdx].totalAmountDisconted);
                           glAmountAux += Number(linelocList[lineIdx].totalAmountDisconted);
                        }

                        // sum Amt. With Incl. Tax from charge lines
                        var lineLocCharges = linelocList.filter(function (lineLoc) {
                           return (lineLoc.relationchargeitemlineno == linelocList[lineIdx].lineNo)
                        });

                        lineLocCharges.map(function (lineLocChrg) {
                           fiscalValueObj.glamount += Number(lineLocChrg.totalAmountDisconted);
                           glAmountAux += Number(lineLocChrg.totalAmountDisconted);
                        });

                        fiscalValueObj.icmsBasisAmount += Number(detailIcmsLine.base);
                        fiscalValueObj.icmsExemptAmount += Number(detailIcmsLine.exemptAmount);
                        fiscalValueObj.icmsOthersAmount += Number(detailIcmsLine.othersBasisAmount);
                        fiscalValueObj.icmsAmount += Number(detailIcmsLine.amount);

                        // get charge amounts
                        var detailICMSListFromCharge = detaillocList.filter(function (detail) {
                           return (
                              detail.relationChargeItemLineNo == detailIcmsLine.invoiceLineNo &&
                              detail.taxIdent == '2'      // ICMS
                           );
                        });
                        detailICMSListFromCharge.map(function (detailOfCharge) {
                           fiscalValueObj.icmsBasisAmount += Number(detailOfCharge.base);
                           fiscalValueObj.icmsExemptAmount += Number(detailOfCharge.exemptAmount);
                           fiscalValueObj.icmsOthersAmount += Number(detailOfCharge.othersBasisAmount);
                           fiscalValueObj.icmsAmount += Number(detailOfCharge.amount);
                        });

                        // IPI
                        var detailFilteredIpiAndLineNoList = detaillocList.filter(function (detailLine) {
                           return (detailLine.invoiceLineNo == detailIcmsLine.invoiceLineNo && detailLine.taxIdent == '1');
                        })

                        detailFilteredIpiAndLineNoList.forEach(function (detailIpiLine) {
                           fiscalValueObj.ipiBasisAmount += Number(detailIpiLine.base);
                           fiscalValueObj.ipiExemptAmount += Number(detailIpiLine.exemptAmount);
                           fiscalValueObj.ipiOthersAmount += Number(detailIpiLine.othersBasisAmount);
                           fiscalValueObj.ipiAmount += Number(detailIpiLine.amount);
                        });

                        // get IPI charge amounts
                        var detailIPIListFromCharge = detaillocList.filter(function (detail) {
                           return (
                              detail.relationChargeItemLineNo == detailIcmsLine.invoiceLineNo &&
                              detail.taxIdent == '1'      // IPI
                           );
                        });
                        detailIPIListFromCharge.map(function (detail) {
                           fiscalValueObj.ipiBasisAmount += Number(detail.base);
                           fiscalValueObj.ipiExemptAmount += Number(detail.exemptAmount);
                           fiscalValueObj.ipiOthersAmount += Number(detail.othersBasisAmount);
                           fiscalValueObj.ipiAmount += Number(detail.amount);
                        });

                        if (transactionObj.transacBodyFields.entityObj.indicatorIeAddressee == 3 || !transactionObj.transacBodyFields.entityObj.indicatorIeAddressee) { // 3 = 9-No Taxpayer
                           fiscalValueObj.nonContributingBookValue += glAmountAux;
                           fiscalValueObj.nonTaxpayerCalculationBasis += Number(detailIcmsLine.base);
                           // fiscalValueObj.taxpayerBookValue = 0;
                           // fiscalValueObj.taxpayerCalculationBasis = 0;
                        } else {
                           // fiscalValueObj.nonContributingBookValue = 0;
                           // fiscalValueObj.nonTaxpayerCalculationBasis = 0;
                           fiscalValueObj.taxpayerBookValue += glAmountAux;
                           fiscalValueObj.taxpayerCalculationBasis += Number(detailIcmsLine.base);
                        }

                     }

                  });

               } else {

                  var detailFilteredIpiList = groupByCFOPList[i].detailByCFOP.filter(function (detailloc) {
                     return (detailloc.taxIdent == '1');
                  });

                  detailFilteredIpiList.forEach(function (detailIpiLine) {

                     if (!(fiscalValueObj.lineLocInvoiceLineNo.indexOf(detailIpiLine.invoiceLineNo) >= 0) && detailIpiLine.itemType != 'OthCharge') {

                        var glAmountAux = 0;

                        fiscalValueObj.lineLocInvoiceLineNo.push(detailIpiLine.invoiceLineNo);

                        var lineIdx = linelocList.map(function (lineLoc) {
                           return (lineLoc.lineNo == detailIpiLine.invoiceLineNo)
                        }).indexOf(true);

                        if (lineIdx >= 0) {
                           fiscalValueObj.glamount += Number(linelocList[lineIdx].totalAmountDisconted);
                           glAmountAux += Number(linelocList[lineIdx].totalAmountDisconted);
                        }

                        // sum Amt. With Incl. Tax from charge lines
                        var lineLocCharges = linelocList.filter(function (lineLoc) {
                           return (lineLoc.relationchargeitemlineno == linelocList[lineIdx].lineNo)
                        });

                        lineLocCharges.map(function (lineLocChrg) {
                           fiscalValueObj.glamount += Number(lineLocChrg.totalAmountDisconted);
                           glAmountAux += Number(lineLocChrg.totalAmountDisconted);
                        });

                        fiscalValueObj.ipiBasisAmount += Number(detailIpiLine.base);
                        fiscalValueObj.ipiExemptAmount += Number(detailIpiLine.exemptAmount);
                        fiscalValueObj.ipiOthersAmount += Number(detailIpiLine.othersBasisAmount);
                        fiscalValueObj.ipiAmount += Number(detailIpiLine.amount);

                        // get IPI charge amounts
                        var detailIPIListFromCharge = detaillocList.filter(function (detail) {
                           return (
                              detail.relationChargeItemLineNo == detailIpiLine.invoiceLineNo &&
                              detail.taxIdent == '1'      // IPI
                           );
                        });
                        detailIPIListFromCharge.map(function (detail) {
                           fiscalValueObj.ipiBasisAmount += Number(detail.base);
                           fiscalValueObj.ipiExemptAmount += Number(detail.exemptAmount);
                           fiscalValueObj.ipiOthersAmount += Number(detail.othersBasisAmount);
                           fiscalValueObj.ipiAmount += Number(detail.amount);
                        });

                        if (transactionObj.transacBodyFields.entityObj.indicatorIeAddressee == 3 || !transactionObj.transacBodyFields.entityObj.indicatorIeAddressee) { // 3 = 9-No Taxpayer
                           fiscalValueObj.nonContributingBookValue += glAmountAux;
                           // fiscalValueObj.nonTaxpayerCalculationBasis = 0;
                           // fiscalValueObj.taxpayerBookValue = 0;
                           // fiscalValueObj.taxpayerCalculationBasis = 0;
                        } else {
                           // fiscalValueObj.nonContributingBookValue = 0;
                           // fiscalValueObj.nonTaxpayerCalculationBasis = 0;
                           fiscalValueObj.taxpayerBookValue += glAmountAux;
                           // fiscalValueObj.taxpayerCalculationBasis = 0;
                        }

                     }

                  });
               }

               detailLocIcmsAndIpiList.push(fiscalValueObj);
            }
         }

         return detailLocIcmsAndIpiList;
      }

      function groupByCfopAndCstList() {
         for (var i = 0; i < detaillocList.length; i++) {

            if (detaillocList[i].taxIdent == 1) {//IPI
               var idx = CfopAndCstList.map(function (elem) {
                  return (elem.cstCode == detaillocList[i].cstCodeIPI && elem.cfopCode == detaillocList[i].cfopCode)
               }).indexOf(true)

               if (idx < 0) {
                  CfopAndCstList.push({ cstCode: detaillocList[i].cstCodeIPI, cfopCode: detaillocList[i].cfopCode });

                  var groupDetailByCFOPandIPI = detaillocList.filter(function (detailLoc) {
                     return (detailLoc.cfopCode == detaillocList[i].cfopCode && detailLoc.cstCodeIPI == detaillocList[i].cstCodeIPI)
                  });

                  groupByCfopAndCstList.push({
                     cfopCode: detaillocList[i].cfopCode,
                     cfopDesc: detaillocList[i].cfopDesc,
                     cstCode: detaillocList[i].cstCodeIPI,
                     detailFiltered: groupDetailByCFOPandIPI
                  });
               }
            }
         }
      }



      //Summary Structure
      function getFiscalBenefitCode(fiscBenCodeId) {
         if (!fiscBenCodeId)
            return {};

         var lookupFieldFiscBenefitCode = search.lookupFields({
            type: 'customrecord_mts_estsettgroup',
            id: fiscBenCodeId,
            columns: [
               'name',
               'altname'
            ]
         });

         return {
            code: lookupFieldFiscBenefitCode.name,
            description: lookupFieldFiscBenefitCode.altname,
         }
      }
      function fillTableAuxDetailBlockE115(listDetailICMS, taxSettlementRec) {
         // var detaillocList = transactionObj.headerlocSublistFields.detaillocList;
         // var blockE115DetailList= [];


         for (var i = 0; i < listDetailICMS.length; i++) {
            var line = taxSettlementRec.getLineCount({ sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df' });

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df', line: line });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_taxsettcod_blocke115df',
               value: taxSettlementRec.id
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_branchcode_blocke115df',
               value: listDetailICMS[i].branchCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_fiscbencode_blocke115df',
               value: listDetailICMS[i].fiscalBenefitCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_postdate_blocke115df',
               value: new Date(listDetailICMS[i].postingDate)
            });
            //taxSettlementRec.setCurrentSublistValue({sublistId:'recmachcustrecord_mts_taxsettcod_blocke115df',fieldId:'custrecord_mts_docno_blocke115df',value: listDetailICMS[i].});

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_doctype_blocke115df',
               value: listDetailICMS[i].documentType
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_sourcetype_blocke115df',
               value: listDetailICMS[i].sourceType
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_extdocno_blocke115df',
               value: listDetailICMS[i].externalDocNo
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_lineno_blocke115df',
               value: listDetailICMS[i].invoiceLineNo
            });
            //taxSettlementRec.setCurrentSublistValue({sublistId:'recmachcustrecord_mts_taxsettcod_blocke115df',fieldId: 'custrecord_mts_no_blocke115df',value: listDetailICMS[i].});

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_base_blocke115df',
               value: listDetailICMS[i].base
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_taxidentif_blocke115df',
               value: listDetailICMS[i].taxIdent
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_amount_blocke115df',
               value: listDetailICMS[i].amount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_basedecla_blacke115df',
               value: listDetailICMS[i].baseDeclarotory
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_percdecla_blocke115df',
               value: listDetailICMS[i].percDeclaratory
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df',
               fieldId: 'custrecord_mts_amountdecla_blocke115df',
               value: listDetailICMS[i].amountDeclarotory
            });
            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettcod_blocke115df' });
         }
      }
      function summarizeBlock0150(tranBlock0150Obj, block0150List, isSpedContribution) {
         var tranCode = tranBlock0150Obj.code;

         if (tranCode) {
            // verify if exists in list
            var _0150Idx = block0150List.map(function (bl0150) {
               if (isSpedContribution)
                  return (bl0150.code == tranCode && bl0150.branchCode == tranBlock0150Obj.branchCode);
               else
                  return (bl0150.code == tranCode);
            }).indexOf(true);

            // if not exist, insert it.
            if (_0150Idx < 0) {
               block0150List.push(tranBlock0150Obj);
            }
         }

      }
      function summarizeBlock0190(tranBlock0190List, block0190List, isSpedContribution) {

         for (var a = 0; a < tranBlock0190List.length; a++) {

            // verify if exists in list
            var _0190Idx = block0190List.map(function (bl0190) {
               if (isSpedContribution)
                  return (bl0190.unitMeasureCode == tranBlock0190List[a].unitMeasureCode && bl0190.branchCode == tranBlock0190List[a].branchCode);
               else
                  return (bl0190.unitMeasureCode == tranBlock0190List[a].unitMeasureCode);
            }).indexOf(true);

            // if not exist, insert it.
            if (_0190Idx < 0) {
               block0190List.push(tranBlock0190List[a]);
            }

         }
      }
      function summarizeBlock0200(tranBlock0200List, block0200List, isSpedContribution) {

         for (var a = 0; a < tranBlock0200List.length; a++) {

            // verify if exists in list
            var _0200Idx = block0200List.map(function (bl0200) {
               if (isSpedContribution)
                  return (bl0200.prodOrderNo == tranBlock0200List[a].prodOrderNo && bl0200.branchCode == tranBlock0200List[a].branchCode);
               else
                  return (bl0200.prodOrderNo == tranBlock0200List[a].prodOrderNo)
            }).indexOf(true);

            // if not exist, insert it.
            if (_0200Idx < 0) {
               block0200List.push({
                  mustBeCreated: tranBlock0200List[a].mustBeCreated,
                  itemCode: tranBlock0200List[a].itemCode,
                  type: tranBlock0200List[a].type,
                  servicecode: tranBlock0200List[a].servicecode,
                  prodOrderNo: tranBlock0200List[a].prodOrderNo,
                  description: tranBlock0200List[a].description,
                  descriptionTwo: tranBlock0200List[a].descriptionTwo,
                  unitofmeasure: tranBlock0200List[a].unitofmeasure,
                  nbmSh: tranBlock0200List[a].nbmSh,
                  excCodeNbmSh: tranBlock0200List[a].excCodeNbmSh,
                  icmsPerc: tranBlock0200List[a].icmsPerc,
                  cestCode: tranBlock0200List[a].cestCode,
                  itemType: tranBlock0200List[a].itemType,
                  branchCode: tranBlock0200List[a].branchCode,
                  _0220List: []
               });
               if (Object.keys(tranBlock0200List[a]._0220Obj).length)
                  block0200List[block0200List.length - 1]._0220List.push(tranBlock0200List[a]._0220Obj)

            } else {
               summarizeBlock0220(tranBlock0200List[a]._0220Obj, block0200List[_0200Idx]._0220List)
            }
         }
      }
      function summarizeBlock0220(tranBlock0220Obj, block0220List) {

         if (Object.keys(tranBlock0220Obj).length) {
            if (tranBlock0220Obj.code) {
               var _0220Idx = block0220List.map(function (bl0220) {
                  return (bl0220.code == tranBlock0220Obj.code);
               }).indexOf(true);

               // if not exist, insert it.
               if (_0220Idx < 0) {
                  if (Object.keys(tranBlock0220Obj).length)
                     block0220List.push(tranBlock0220Obj);
               }
            }
         }
      }
      function summarizeBlock0400(tranBlock0400List, block0400List, isSpedContribution) {
         for (var a = 0; a < tranBlock0400List.length; a++) {

            if (tranBlock0400List[a].code) {
               // verify if exists in list
               var _0400Idx = block0400List.map(function (bl0400) {
                  if (isSpedContribution)
                     return (bl0400.code == tranBlock0400List[a].code && bl0400.branchCode == tranBlock0400List[a].branchCode);
                  else
                     return (bl0400.code == tranBlock0400List[a].code);
               }).indexOf(true);

               // if not exist, insert it.
               if (_0400Idx < 0) {
                  block0400List.push(tranBlock0400List[a]);
               }
            }
         }
      }
      function summarizeBlock0500(tranBlock0500List, block0500List) {
         for (var a = 0; a < tranBlock0500List.length; a++) {
            var accountCode = tranBlock0500List[a].accountCode;

            if (accountCode) {
               // verify if exists in list
               var _0500Idx = block0500List.map(function (bl0500) {
                  return (bl0500.accountCode == tranBlock0500List[a].accountCode);
               }).indexOf(true);

               // if not exist, insert it.
               if (_0500Idx < 0) {
                  block0500List.push(tranBlock0500List[a]);
               }
            }
         }
      }
      function summarizeBlockE115(tranBlockE115List, blockE115List) {

         tranBlockE115List.map(function (elem) {

            var fiscalBenefitCode = elem.fiscalBenefitCode;
            var branchCode = elem.branchCode;
            var amountDeclarotory = Number(elem.amountDeclarotory);

            var _E115Idx = blockE115List.map(function (blE115) {
               return (blE115.fiscalBenefitCode == fiscalBenefitCode);
            }).indexOf(true);

            if (_E115Idx >= 0) {
               blockE115List[_E115Idx].vlinfadic += amountDeclarotory;
            } else {
               var fiscBenefitCodeObj = getFiscalBenefitCode(fiscalBenefitCode);

               blockE115List.push({
                  branchCode: branchCode,
                  fiscalBenefitCode: fiscalBenefitCode,
                  codinfadc: fiscBenefitCodeObj.code,
                  desccompaj: fiscBenefitCodeObj.description,
                  vlinfadic: amountDeclarotory
               });
            }
         });
      }
      function summarizeBlockE200(tranBlockE200Obj, blockE200List) {
         var territoryCodeGroup = tranBlockE200Obj._e210List.reduce(function (acumulador, valor) {
            var array = acumulador.map(function (elem) { return elem });
            var indice = array.indexOf(valor.territoryCode);
            if (indice == -1) {
               acumulador.push(valor.territoryCode);
            }
            return acumulador;
         }, []);

         if (territoryCodeGroup.length) {
            for (var i = 0; i < territoryCodeGroup.length; i++) {

               var territoryCode = territoryCodeGroup[i];

               var _E210Filtered = tranBlockE200Obj._e210List.filter(function (elem) {
                  return (elem.territoryCode == territoryCode);
               });
               _e210Obj = {
                  returnStAmount: 0,
                  compensationStAmount: 0,
                  retentionStAmount: 0,
                  icmsStOtherCredits: 0,
                  indMovDifal: ''
               };

               _E210Filtered.map(function (blE210, index) {
                  _e210Obj.returnStAmount += Number(blE210.returnStAmount);
                  _e210Obj.compensationStAmount += Number(blE210.compensationStAmount);
                  _e210Obj.retentionStAmount += Number(blE210.retentionStAmount);
                  _e210Obj.icmsStOtherCredits += Number(blE210.icmsStOtherCredits);

                  if (blE210.indMovDifal == 2 && (_e210Obj.indMovDifal == 1 || !_e210Obj.indMovDifal))
                     _e210Obj.indMovDifal = blE210.indMovDifal;
                  else if (blE210.indMovDifal == 1 && _e210Obj.indMovDifal != 2)
                     _e210Obj.indMovDifal = blE210.indMovDifal;
               })

               var blE200Index = blockE200List.map(function (blE210) {
                  return (blE210.territoryCode == territoryCode)
               }).indexOf(true);

               if (blE200Index >= 0) {

                  blockE200List[blE200Index]._e210Obj.returnStAmount += Number(_e210Obj.returnStAmount);
                  blockE200List[blE200Index]._e210Obj.compensationStAmount += Number(_e210Obj.compensationStAmount);
                  blockE200List[blE200Index]._e210Obj.retentionStAmount += Number(_e210Obj.retentionStAmount);
                  blockE200List[blE200Index]._e210Obj.icmsStOtherCredits += Number(_e210Obj.icmsStOtherCredits);

                  if (_e210Obj.indMovDifal == 2 && (blockE200List[blE200Index].indMovDifal == 1 || !blockE200List[blE200Index].indMovDifal))
                     blockE200List[blE200Index].indMovDifal = _e210Obj.indMovDifal;
                  else if (_e210Obj.indMovDifal == 1 && blockE200List[blE200Index].indMovDifal != 2)
                     blockE200List[blE200Index].indMovDifal = _e210Obj.indMovDifal;

               } else {
                  blockE200List.push({
                     territoryCode: territoryCode,
                     _e210Obj: _e210Obj
                  })
               }
            }
         }
      }
      function summarizeBlockE300(tranBlockE300Obj, blockE300List) {
         var territoryCodeGroup = tranBlockE300Obj._e310List.reduce(function (acumulador, valor) {
            var array = acumulador.map(function (elem) { return elem });
            var indice = array.indexOf(valor.territoryCode);
            if (indice == -1) {
               acumulador.push(valor.territoryCode);
            }
            return acumulador;
         }, []);


         if (territoryCodeGroup.length) {
            for (var i = 0; i < territoryCodeGroup.length; i++) {

               var territoryCode = territoryCodeGroup[i];

               var _E310Filtered = tranBlockE300Obj._e310List.filter(function (elem) {
                  return (elem.territoryCode == territoryCode);
               });
               _e310Obj = {
                  amountCreditFCP: 0,
                  amountCreditFcpRem: 0,
                  amountCreditFcpEmit: 0,
                  amountDebitFCP: 0,
                  amountDebitFcpRem: 0,
                  amountDebitFcpEmit: 0,
                  indMovDifal: ''
               };
               _E310Filtered.map(function (blE310, index) {
                  _e310Obj.amountCreditFCP += Number(blE310.amountCreditFCP);
                  _e310Obj.amountCreditFcpRem += Number(blE310.amountCreditFcpRem);
                  _e310Obj.amountCreditFcpEmit += Number(blE310.amountCreditFcpEmit);
                  _e310Obj.amountDebitFCP += Number(blE310.amountDebitFCP);
                  _e310Obj.amountDebitFcpRem += Number(blE310.amountDebitFcpRem);
                  _e310Obj.amountDebitFcpEmit += Number(blE310.amountDebitFcpEmit);


                  if (blE310.indMovDifal == 2 && (_e310Obj.indMovDifal == 1 || !_e310Obj.indMovDifal))
                     _e310Obj.indMovDifal = blE310.indMovDifal;
                  else if (blE310.indMovDifal == 1 && _e310Obj.indMovDifal != 2)
                     _e310Obj.indMovDifal = blE310.indMovDifal;
               })

               var blE300Index = blockE300List.map(function (blE310) {
                  return (blE310.territoryCode == territoryCode)
               }).indexOf(true);

               if (blE300Index >= 0) {
                  blockE300List[blE300Index]._e310Obj.amountCreditFCP += Number(_e310Obj.amountCreditFCP);
                  blockE300List[blE300Index]._e310Obj.amountCreditFcpRem += Number(_e310Obj.amountCreditFcpRem);
                  blockE300List[blE300Index]._e310Obj.amountCreditFcpEmit += Number(_e310Obj.amountCreditFcpEmit);
                  blockE300List[blE300Index]._e310Obj.amountDebitFCP += Number(_e310Obj.amountDebitFCP);
                  blockE300List[blE300Index]._e310Obj.amountDebitFcpRem += Number(_e310Obj.amountDebitFcpRem);
                  blockE300List[blE300Index]._e310Obj.amountDebitFcpEmit += Number(_e310Obj.amountDebitFcpEmit);

                  if (_e310Obj.indMovDifal == 2 && (blockE300List[blE300Index].indMovDifal == 1 || !blockE300List[blE300Index].indMovDifal))
                     blockE300List[blE300Index].indMovDifal = _e310Obj.indMovDifal;
                  else if (_e310Obj.indMovDifal == 1 && blockE300List[blE300Index].indMovDifal != 2)
                     blockE300List[blE300Index].indMovDifal = _e310Obj.indMovDifal;

               } else {
                  blockE300List.push({
                     territoryCode: territoryCode,
                     _e310Obj: _e310Obj
                  })
               }
            }
         }
      }
      function summarizeBlockE510(tranBlockE510List, blockE510List) {

         for (var a = 0; a < tranBlockE510List.length; a++) {

            var _0510Idx = blockE510List.map(function (elem) {
               return (elem.cfopCode == tranBlockE510List[a].cfopCode && elem.cstCode == tranBlockE510List[a].cstCode);
            }).indexOf(true);


            if (_0510Idx >= 0) {
               blockE510List[_0510Idx].IPIBasisAmount += Number(tranBlockE510List[a].IPIBasisAmount);
               blockE510List[_0510Idx].IPIexemptBasisAmount += Number(tranBlockE510List[a].IPIexemptBasisAmount);
               blockE510List[_0510Idx].IPIotherBasisAmount += Number(tranBlockE510List[a].IPIotherBasisAmount);
               blockE510List[_0510Idx].IPIamount += Number(tranBlockE510List[a].IPIamount);
               blockE510List[_0510Idx].glamount += Number(tranBlockE510List[a].glamount);
            } else {
               blockE510List.push(tranBlockE510List[a]);
            }
         }
      }
      function summarizeBlockD600(tranBlockD600Obj, blockD600List) {
         if (Object.keys(tranBlockD600Obj).length) {

            for (var i = 0; i < tranBlockD600Obj.taxes.length; i++) {
               var revenueType = tranBlockD600Obj.taxes[i].revenueType || '';
               var ibgecitycode = tranBlockD600Obj.ibgecitycode || '';
               var seriesub = tranBlockD600Obj.seriesub || '';

               if (revenueType || ibgecitycode || seriesub) {
                  // verify if exists in list
                  var _D600Idx = blockD600List.map(function (blD600) {
                     return (
                        blD600.revenueType == revenueType &&
                        blD600.ibgecitycode == ibgecitycode &&
                        blD600.seriesub == seriesub
                     );
                  }).indexOf(true);

                  // if not exist, insert it.
                  if (_D600Idx < 0) {
                     objD600 = {
                        revenueType: tranBlockD600Obj.taxes[i].revenueType,
                        ibgecitycode: tranBlockD600Obj.ibgecitycode,
                        fiscalmodelcod: tranBlockD600Obj.fiscalmodelcod,
                        quantity: 1,
                        startDocDate: tranBlockD600Obj.docdate,
                        endDocDate: tranBlockD600Obj.docdate,
                        fiscaltype: tranBlockD600Obj.fiscaltype,
                        seriesub: tranBlockD600Obj.seriesub,
                        glamount: tranBlockD600Obj.glamount,
                        branchCode: tranBlockD600Obj.branchCode,
                        fiscaldoctype: tranBlockD600Obj.fiscaldoctype,
                        icmsperc: tranBlockD600Obj.icmsperc,
                        icmsotheramount: tranBlockD600Obj.taxes[i].icmsotheramount,
                        icmsexemptamount: tranBlockD600Obj.taxes[i].icmsexemptamount,
                        icmsbasisamount: tranBlockD600Obj.taxes[i].icmsbasisamount,
                        icmsamount: tranBlockD600Obj.taxes[i].icmsamount,
                        pisamount: tranBlockD600Obj.taxes[i].pisamount,
                        cofinsamount: tranBlockD600Obj.taxes[i].cofinsamount,

                        _d601List: tranBlockD600Obj._d601List || [],
                        _d605List: tranBlockD600Obj._d605List || []
                     }

                     blockD600List.push(objD600);
                  } else {
                     blockD600List[_D600Idx].endDocDate = tranBlockD600Obj.docdate;
                     blockD600List[_D600Idx].icmsotheramount += tranBlockD600Obj.taxes[i].icmsotheramount;
                     blockD600List[_D600Idx].icmsexemptamount += tranBlockD600Obj.taxes[i].icmsexemptamount;
                     blockD600List[_D600Idx].icmsbasisamount += tranBlockD600Obj.taxes[i].icmsbasisamount;
                     blockD600List[_D600Idx].icmsamount += tranBlockD600Obj.taxes[i].icmsamount;
                     blockD600List[_D600Idx].pisamount += tranBlockD600Obj.taxes[i].pisamount;
                     blockD600List[_D600Idx].cofinsamount += tranBlockD600Obj.taxes[i].cofinsamount;
                     blockD600List[_D600Idx].quantity += 1;

                     summarizeBlockD601(tranBlockD600Obj._d601List, blockD600List[_D600Idx]._d601List);
                     summarizeBlockD605(tranBlockD600Obj._d605List, blockD600List[_D600Idx]._d605List);
                  }
               }
            }
         }
      }
      function summarizeBlockD601(tranBlockD601List, blockD601List) {

         for (var a = 0; a < tranBlockD601List.length; a++) {

            var tranClassItem = tranBlockD601List[a].classItem;

            var _D601Idx = blockD601List.map(function (blD601) {
               return (blD601.classItem == tranClassItem);
            }).indexOf(true);

            // if not exist, insert it.
            if (_D601Idx < 0) {
               blockD601List.push(tranBlockD601List[a]);

            } else {
               blockD601List[_D601Idx].lineamount += Number(tranBlockD601List[a].lineamount);
               blockD601List[_D601Idx].pisbasisamount += tranBlockD601List[a].pisbasisamount;
               blockD601List[_D601Idx].pisamount += tranBlockD601List[a].pisamount;
            }
         }
      }
      function summarizeBlockD605(tranBlockD605List, blockD605List) {

         for (var a = 0; a < tranBlockD605List.length; a++) {

            var tranClassItem = tranBlockD605List[a].classItem;

            var _D605Idx = blockD605List.map(function (blD605) {
               return (blD605.classItem == tranClassItem);
            }).indexOf(true);

            // if not exist, insert it.
            if (_D605Idx < 0) {
               blockD605List.push(tranBlockD605List[a]);

            } else {
               blockD605List[_D605Idx].lineamount += Number(tranBlockD605List[a].lineamount);
               blockD605List[_D605Idx].cofinsbasisamount += tranBlockD605List[a].cofinsbasisamount;
               blockD605List[_D605Idx].cofinsamount += tranBlockD605List[a].cofinsamount;
            }
         }
      }
      function summarizeBlockD695(tranBlockD695Obj, blockD695List) {
         var masterDigitalAuthCode = tranBlockD695Obj.masterDigitalAuthCode

         if (masterDigitalAuthCode) {
            // verify if exists in list
            var _D695Idx = blockD695List.map(function (blD695) {
               return (blD695.masterDigitalAuthCode == masterDigitalAuthCode);
            }).indexOf(true);

            // if not exist, insert it.
            if (_D695Idx < 0) {
               objD695 = {
                  fiscalmodelcod: tranBlockD695Obj.fiscalmodelcod,
                  fiscaltype: tranBlockD695Obj.fiscaltype,
                  seriesub: tranBlockD695Obj.seriesub,
                  startDocNo: tranBlockD695Obj.docno,
                  endDocNo: tranBlockD695Obj.docno,
                  startDocDate: tranBlockD695Obj.docdate,
                  endDocDate: tranBlockD695Obj.docdate,
                  nomeMaster: tranBlockD695Obj.nomeMaster,
                  masterDigitalAuthCode: tranBlockD695Obj.masterDigitalAuthCode,

                  _d696List: tranBlockD695Obj._d696List
               }

               blockD695List.push(objD695);
            } else {
               blockD695List[_D695Idx].endDocNo = tranBlockD695Obj.docno;
               blockD695List[_D695Idx].endDocDate = tranBlockD695Obj.docdate;

               summarizeBlockD696(tranBlockD695Obj._d696List, blockD695List[_D695Idx]._d696List);
            }
         }
      }
      function summarizeBlockD696(tranBlockD696List, blockD696List) {

         for (var a = 0; a < tranBlockD696List.length; a++) {

            var tranCstCode = tranBlockD696List[a].cstcode;
            var tranCfopCode = tranBlockD696List[a].cfopcode;
            var tranIcmsPerc = tranBlockD696List[a].icmspercent;


            var _D696Idx = blockD696List.map(function (blD696) {
               return (blD696.cstcode == tranCstCode && blD696.cfopcode == tranCfopCode && blD696.icmspercent == tranIcmsPerc);
            }).indexOf(true);

            // if not exist, insert it.
            if (_D696Idx < 0) {
               blockD696List.push(tranBlockD696List[a]);

            } else {
               blockD696List[_D696Idx].icmsbasisamount += tranBlockD696List[a].icmsbasisamount;
               blockD696List[_D696Idx].icmsamount += tranBlockD696List[a].icmsamount;
               blockD696List[_D696Idx].icmsexemptamount += tranBlockD696List[a].icmsexemptamount;
               blockD696List[_D696Idx].icmsothersamount += tranBlockD696List[a].icmsothersamount;
            }
         }
      }
      function summarizeBlock1900(tranBlock1900Obj, block1900List) {
         if (Object.keys(tranBlock1900Obj).length) {

            var _1900Idx = block1900List.map(function (bl1900) {
               return (
                  bl1900.branchCode == tranBlock1900Obj.branchCode &&
                  bl1900.pisCstCode == tranBlock1900Obj.pisCstCode &&
                  bl1900.cofinsCstCode == tranBlock1900Obj.cofinsCstCode &&
                  bl1900.COD_SIT == tranBlock1900Obj.COD_SIT &&
                  bl1900.COD_MOD == tranBlock1900Obj.COD_MOD &&
                  bl1900.cpfCnpj == tranBlock1900Obj.cpfCnpj
               );
            }).indexOf(true);

            // if not exist, insert it.
            if (_1900Idx < 0) {
               block1900List.push(tranBlock1900Obj);

            } else {
               block1900List[_1900Idx].VL_TOT_REC += tranBlock1900Obj.VL_TOT_REC;
            }
         }
         log.debug({ title: 'block1900List', details: block1900List })
      }
      function summarizeCFOPAbstract(CFOPAbstract, CFOPAbstractList) {

         for (var i = 0; i < CFOPAbstract.length; i++) {

            var idx = CFOPAbstractList.map(function (elem) {
               return (
                  elem.fiscalType == CFOPAbstract[i].fiscalType &&
                  elem.cfopCode == CFOPAbstract[i].cfopCode
               )
            }).indexOf(true);


            if (idx < 0) {
               CFOPAbstractList.push(CFOPAbstract[i])
            } else {
               CFOPAbstractList[idx].icmsBasisAmount += CFOPAbstract[i].icmsBasisAmount;
               CFOPAbstractList[idx].icmsExemptAmount += CFOPAbstract[i].icmsExemptAmount;
               CFOPAbstractList[idx].icmsOthersAmount += CFOPAbstract[i].icmsOthersAmount;
               CFOPAbstractList[idx].icmsAmount += CFOPAbstract[i].icmsAmount;
               CFOPAbstractList[idx].ipiBasisAmount += CFOPAbstract[i].ipiBasisAmount;
               CFOPAbstractList[idx].ipiExemptAmount += CFOPAbstract[i].ipiExemptAmount;
               CFOPAbstractList[idx].ipiOthersAmount += CFOPAbstract[i].ipiOthersAmount;
               CFOPAbstractList[idx].ipiAmount += CFOPAbstract[i].ipiAmount;
               CFOPAbstractList[idx].amount += CFOPAbstract[i].amount;
               CFOPAbstractList[idx].glAmount += CFOPAbstract[i].glAmount;
            }
         }

      }
      function summarizeStateAbstract(tranStateAbstractObj, stateAbsList) {

         var idx = stateAbsList.map(function (elem) {
            return (
               elem.territoryCode == tranStateAbstractObj.territoryCode &&
               elem.fiscalType == tranStateAbstractObj.fiscalType
            )
         }).indexOf(true);

         if (idx < 0) {
            stateAbsList.push(tranStateAbstractObj)
         } else {

            for (var i = 0; i < tranStateAbstractObj.fiscalValues.length; i++) {

               var fiscValIdx = stateAbsList[idx].fiscalValues.map(function (elem) {
                  return (elem.cfopCode == tranStateAbstractObj.fiscalValues[i].cfopCode)
               }).indexOf(true);

               if (fiscValIdx >= 0) {

                  stateAbsList[idx].fiscalValues[fiscValIdx].icmsBasisAmount += tranStateAbstractObj.fiscalValues[i].icmsBasisAmount;
                  stateAbsList[idx].fiscalValues[fiscValIdx].icmsExemptAmount += tranStateAbstractObj.fiscalValues[i].icmsExemptAmount;
                  stateAbsList[idx].fiscalValues[fiscValIdx].icmsOthersAmount += tranStateAbstractObj.fiscalValues[i].icmsOthersAmount;
                  stateAbsList[idx].fiscalValues[fiscValIdx].icmsAmount += tranStateAbstractObj.fiscalValues[i].icmsAmount;
                  stateAbsList[idx].fiscalValues[fiscValIdx].ipiBasisAmount += tranStateAbstractObj.fiscalValues[i].ipiBasisAmount;
                  stateAbsList[idx].fiscalValues[fiscValIdx].ipiExemptAmount += tranStateAbstractObj.fiscalValues[i].ipiExemptAmount;
                  stateAbsList[idx].fiscalValues[fiscValIdx].ipiOthersAmount += tranStateAbstractObj.fiscalValues[i].ipiOthersAmount;
                  stateAbsList[idx].fiscalValues[fiscValIdx].ipiAmount += tranStateAbstractObj.fiscalValues[i].ipiAmount;
                  stateAbsList[idx].fiscalValues[fiscValIdx].glamount += tranStateAbstractObj.fiscalValues[i].glamount;

                  stateAbsList[idx].fiscalValues[fiscValIdx].nonContributingBookValue += tranStateAbstractObj.fiscalValues[i].nonContributingBookValue;
                  stateAbsList[idx].fiscalValues[fiscValIdx].nonTaxpayerCalculationBasis += tranStateAbstractObj.fiscalValues[i].nonTaxpayerCalculationBasis;
                  stateAbsList[idx].fiscalValues[fiscValIdx].taxpayerBookValue += tranStateAbstractObj.fiscalValues[i].taxpayerBookValue;
                  stateAbsList[idx].fiscalValues[fiscValIdx].taxpayerCalculationBasis += tranStateAbstractObj.fiscalValues[i].taxpayerCalculationBasis;

               } else {
                  stateAbsList[idx].fiscalValues.push(tranStateAbstractObj.fiscalValues[i]);
               }
            }
         }
      }
      function initSpedBlock(isSpedContribution) {
         var spedBlockObj = {}
         spedBlockObj.block0150List = [];
         spedBlockObj.block0190List = [];
         spedBlockObj.block0200List = [];
         spedBlockObj.block0400List = [];
         spedBlockObj.block0500List = [];

         if (!isSpedContribution) {
            spedBlockObj.blockE115List = [];
            spedBlockObj.blockE200List = [];
            spedBlockObj.blockE300List = [];
            spedBlockObj.blockE510List = [];

            spedBlockObj.blockD695List = [];
         }

         if (isSpedContribution) {
            spedBlockObj.blockD600List = [];
            spedBlockObj.block1900List = [];
         }

         return spedBlockObj;
      }
      function initBook() {
         var initBookObj = {}
         initBookObj.CFOPAbstractList = [];
         initBookObj.StateAbstractList = [];

         return initBookObj;
      }
      function insertSpedFiscal(spedObj, taxSettlementRec) {
         //Block D695
         if (spedObj.blockD695List.length > 0)
            taxSetInsert.insertD695(spedObj.blockD695List, taxSettlementRec);

         //Block E
         if (spedObj.blockE115List.length > 0)
            taxSetInsert.insertE115(spedObj.blockE115List, taxSettlementRec);
         if (spedObj.blockE200List.length > 0)
            taxSetInsert.insertE200(spedObj.blockE200List, taxSettlementRec);
         if (spedObj.blockE300List.length > 0)
            taxSetInsert.insertE300(spedObj.blockE300List, taxSettlementRec);
         if (spedObj.blockE510List.length > 0)
            taxSetInsert.insertE510(spedObj.blockE510List, taxSettlementRec);

         //Block H
         // aqui
         // var generateInventory = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_inventorydate_taxsettlem' });
         // if (generateInventory) {
         //    var blockH005Obj = generateBlockH(taxSettlementRec, spedObj.block0190List, spedObj.block0200List, spedObj.block0150List);

         //    if (Object.keys(blockH005Obj).length)
         //       taxSetInsert.insertH005(blockH005Obj, taxSettlementRec);
         // }

         //Block K
         // aqui
         // var spedFiscalSetupObj = getSpedFiscalSetup();
         // if (spedFiscalSetupObj.generateBlockK200AndK280) {

         //    var blockK200List = generateBlockK200(taxSettlementRec, spedObj.block0190List, spedObj.block0200List, spedObj.block0150List);
         //    if (blockK200List.length > 0)
         //       taxSetInsert.insertK200(blockK200List, taxSettlementRec);
         // }

         // Block 1
         var block1100List = generateBlock1100(taxSettlementRec, spedObj.block0190List, spedObj.block0200List);
         if (block1100List.length > 0)
            taxSetInsert.insert1100(block1100List, taxSettlementRec);
      }
      function insertSpedContribution(spedObj, taxSettlementRec) {
         //Block 0500
         if (spedObj.block0500List.length > 0)
            taxSetInsert.insert0500(spedObj.block0500List, taxSettlementRec);


         //Block D600
         if (spedObj.blockD600List.length > 0)
            taxSetInsert.insertD600(spedObj.blockD600List, taxSettlementRec);

         //Block 1900
         if (spedObj.block1900List.length > 0)
            taxSetInsert.insert1900(spedObj.block1900List, taxSettlementRec);
      }

      function getListsFromTaxSettlementRec(spedObj, bookObj, taxSettlementRec) {
         // 0150
         // var lineCount = taxSettlementRec.getLineCount({ sublistId: 'recmachcustrecord_mts_taxsettcode_partreg' });
         // for (var a = 0; a < lineCount; a++) {
         //    spedObj.block0150List.push({
         //       mustBeCreated: false,
         //       code: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_code_partreg',
         //          line: a
         //       }),
         //       branchCode: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_branchcode_partreg',
         //          line: a
         //       }),
         //       description: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_description_partreg',
         //          line: a
         //       }),
         //       countryCode: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_countrycode_partreg',
         //          line: a
         //       }),
         //       address: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_address_partreg',
         //          line: a
         //       }),
         //       ibgeCityCode: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_ibgecitycode_partreg',
         //          line: a
         //       }),
         //       number: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_number_partreg',
         //          line: a
         //       }),
         //       district: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_district_partreg',
         //          line: a
         //       }),
         //       branchCode: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_branchcode_partreg',
         //          line: a
         //       }),
         //       suframa: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_sufrcode_partreg',
         //          line: a
         //       }),
         //       cpf: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_cpf_partreg',
         //          line: a
         //       }),
         //       cnpj: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_cnpj_partreg',
         //          line: a
         //       }),
         //       ie: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
         //          fieldId: 'custrecord_mts_ie_part',
         //          line: a
         //       }),
         //    });
         // }

         // 0190
         var lineCount = taxSettlementRec.getLineCount({ sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure' });
         for (var a = 0; a < lineCount; a++) {
            spedObj.block0190List.push({
               mustBeCreated: false,
               code: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure',
                  fieldId: 'custrecord_mts_code_unitmeasure',
                  line: a
               }),
               description: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure',
                  fieldId: 'custrecord_mts_description_unitmeasure',
                  line: a
               }),
               unitMeasureCode: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure',
                  fieldId: 'custrecord_mts_unitmeasucode_untimeasure',
                  line: a
               }),
               branchCode: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure',
                  fieldId: 'custrecord_mts_branchcode_unitmeasure',
                  line: a
               })
            });
         }

         // 0200
         var lineCount = taxSettlementRec.getLineCount({ sublistId: 'recmachcustrecord_mts_taxsettl_efdprod' });
         for (var a = 0; a < lineCount; a++) {
            spedObj.block0200List.push({
               mustBeCreated: false,
               itemCode: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_srcode_efdprod',
                  line: a
               }),
               type: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_productcode_efdprod',
                  line: a
               }),
               servicecode: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_srcode_efdprod',
                  line: a
               }),
               prodOrderNo: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_prodorderno_efdprod',
                  line: a
               }),
               description: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_description_efdprod',
                  line: a
               }),
               descriptionTwo: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_descriptiontwo_efdprod',
                  line: a
               }),
               unitofmeasure: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_unitmeasurefixet_efdprod',
                  line: a
               }),
               nbmSh: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_nbmsh_efdprod',
                  line: a
               }),
               excCodeNbmSh: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_exccodenbmsh_efdprod',
                  line: a
               }),
               icmsPerc: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_icmspercent_efdprod',
                  line: a
               }),
               cestCode: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_cestcode_efdprod',
                  line: a
               }),
               itemType: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_itemtype_efdprod',
                  line: a
               }),
               branchCode: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettl_efdprod',
                  fieldId: 'custrecord_mts_branchcode_efdprod',
                  line: a
               }),
               _0220List: []
            });
         }

         // 0400
         var lineCount = taxSettlementRec.getLineCount({ sublistId: 'recmachcustrecord_mts_code_opernat' });
         for (var a = 0; a < lineCount; a++) {
            spedObj.block0400List.push({
               mustBeCreated: false,
               code: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_code_opernat',
                  fieldId: 'custrecord_mts_codee_opernat',
                  line: a
               }),
               description: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_code_opernat',
                  fieldId: 'custrecord_mts_desc_opernat',
                  line: a
               }),
               branchCode: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_code_opernat',
                  fieldId: 'custrecord_mts_branchcode_opernat',
                  line: a
               })
            });

         }

         // 0500
         var lineCount = taxSettlementRec.getLineCount({ sublistId: 'recmachcustrecord_mts_taxsettle_glaccount' });
         for (var a = 0; a < lineCount; a++) {
            spedObj.block0500List.push({
               mustBeCreated: false,
               internalId: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
                  fieldId: 'id',
                  line: a
               }),
               changeDate: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
                  fieldId: 'custrecord_mts_lastdatemodi_glaccount',
                  line: a
               }),
               accountType: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
                  fieldId: 'custrecord_mts_acctype_glaccount',
                  line: a
               }),
               accountCode: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
                  fieldId: 'custrecord_mts_no_glaccount',
                  line: a
               }),
               accountName: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
                  fieldId: 'custrecord_mts_name_glaccount',
                  line: a
               }),
               indentation: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
                  fieldId: 'custrecord_mts_indentation_glaccount',
                  line: a
               }),
               nivel: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
                  fieldId: 'custrecord_mts_nivel_glaccount',
                  line: a
               }),
            });
         }

         // 1900

         // D600

         // D695
         // var lineCount = taxSettlementRec.getLineCount({ sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov' });
         // for (var a = 0; a < lineCount; a++) {
         //    spedObj.blockD695List.push({
         //       mustBeCreated: false,
         //       internalId: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov',
         //          fieldId: 'id',
         //          line: a
         //       }),
         //       fiscalmodelcod: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov',
         //          fieldId: 'custrecord_mts_fiscmodecode_conservprov',
         //          line: a
         //       }),
         //       fiscaltype: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov',
         //          fieldId: 'custrecord_mts_fiscaltype_conservprov',
         //          line: a
         //       }),
         //       seriesub: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov',
         //          fieldId: 'custrecord_mts_series_conservprov',
         //          line: a
         //       }),
         //       startDocNo: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov',
         //          fieldId: 'custrecord_mts_startdocno_conservprov',
         //          line: a
         //       }),
         //       endDocNo: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov',
         //          fieldId: 'custrecord_mts_enddocno_conservprov',
         //          line: a
         //       }),
         //       startDocDate: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov',
         //          fieldId: 'custrecord_mts_startdocdate_conservprov',
         //          line: a
         //       }),
         //       endDocDate: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov',
         //          fieldId: 'custrecord_mts_enddocdate_conservprov',
         //          line: a
         //       }),
         //       nomeMaster: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov',
         //          fieldId: 'custrecord_mts_filenamemaste_conservprov',
         //          line: a
         //       }),
         //       masterDigitalAuthCode: taxSettlementRec.getSublistValue({
         //          sublistId: 'recmachcustrecord_mts_taxsettlement_conservprov',
         //          fieldId: 'custrecord_mts_masterdigauth_conservprov',
         //          line: a
         //       })
         //    });
         // }

         // E115
         var lineCount = taxSettlementRec.getLineCount({ sublistId: 'recmachcustrecord_mts_taxset_blocke115' });
         for (var a = 0; a < lineCount; a++) {
            spedObj.blockE115List.push({
               mustBeCreated: false,
               internalId: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxset_blocke115',
                  fieldId: 'id',
                  line: a
               }),
               codinfadc: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxset_blocke115',
                  fieldId: 'custrecord_mts_codinfadc_blocke115',
                  line: a
               }),
               desccompaj: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxset_blocke115',
                  fieldId: 'custrecord_mts_desccompaj_blocke115',
                  line: a
               }),
               vlinfadic: parseFloat(taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxset_blocke115',
                  fieldId: 'custrecord_mts_vlinfadic_blocke115',
                  line: a
               }))
            });
         }

         // E200
         var customrecord_mts_taxsettementstSearchObj = search.create({
            type: "customrecord_mts_taxsettementst",
            filters:
               [
                  ["custrecord_mts_taxsettlem_taxsettementst", "anyof", taxSettlementRec.id]
               ],
            columns:
               [
                  search.createColumn({
                     name: "custrecord_mts_taxsettlem_taxsettementst",
                     summary: "GROUP"
                  }),
                  search.createColumn({
                     name: "custrecord_mts_alttaxpaye_taxsettementst",
                     summary: "GROUP"
                  }),
                  search.createColumn({
                     name: "custrecord_mts_territory_taxsettementst",
                     summary: "GROUP"
                  }),
                  search.createColumn({
                     name: "custrecord_mts_indmovdifa_taxsettementst",
                     summary: "MAX"
                  }),
                  search.createColumn({
                     name: "custrecord_mts_retstamt_taxsettementst",
                     summary: "SUM"
                  }),
                  search.createColumn({
                     name: "custrecord_mts_compstamt_taxsettementst",
                     summary: "SUM"
                  }),
                  search.createColumn({
                     name: "custrecord_mts_otherscred_taxsettementst",
                     summary: "SUM"
                  }),
                  search.createColumn({
                     name: "custrecord_mts_retstmamt_taxsettementst",
                     summary: "SUM"
                  })
               ]
         });
         customrecord_mts_taxsettementstSearchObj.run().each(function (result) {
            spedObj.blockE200List.push({
               mustBeCreated: false,
               id: result.getValue({ name: 'custrecord_mts_alttaxpaye_taxsettementst', summary: 'group' }),
               territoryCode: result.getValue({ name: 'custrecord_mts_territory_taxsettementst', summary: 'group' }),
               _e210Obj: {
                  indMovDifal: Number(result.getValue({ name: 'custrecord_mts_indmovdifa_taxsettementst', summary: 'max' }).substr(0, 1)) + 1,
                  returnStAmount: parseFloat(result.getValue({ name: 'custrecord_mts_retstamt_taxsettementst', summary: 'sum' })) || 0,
                  compensationStAmount: parseFloat(result.getValue({ name: 'custrecord_mts_compstamt_taxsettementst', summary: 'sum' })) || 0,
                  icmsStOtherCredits: parseFloat(result.getValue({ name: 'custrecord_mts_otherscred_taxsettementst', summary: 'sum' })) || 0,
                  retentionStAmount: parseFloat(result.getValue({ name: 'custrecord_mts_retstmamt_taxsettementst', summary: 'sum' })) || 0
               }
            });

            return true;
         });

         // E510
         var lineCount = taxSettlementRec.getLineCount({ sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt' });
         for (var a = 0; a < lineCount; a++) {
            spedObj.blockE510List.push({
               mustBeCreated: false,
               line: a,
               cfopCode: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
                  fieldId: 'custrecord_mts_cfopcode_taxconsamt',
                  line: a
               }),
               cstCode: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
                  fieldId: 'custrecord_mts_cstcode_taxconsamt',
                  line: a
               }),
               glamount: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
                  fieldId: 'custrecord_mts_glamount_taxconsamt',
                  line: a
               }),
               IPIBasisAmount: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
                  fieldId: 'custrecord_mts_ipibasisamt_taxconsamt',
                  line: a
               }),
               IPIamount: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
                  fieldId: 'custrecord_mts_ipiamount_taxconsamt',
                  line: a
               }),
               IPIexemptBasisAmount: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
                  fieldId: 'custrecord_mts_ipiexemptamt_taxconsamt',
                  line: a
               }),
               IPIotherBasisAmount: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
                  fieldId: 'custrecord_mts_ipiothersamt_taxconsamt',
                  line: a
               }),
               fiscalType: taxSettlementRec.getSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
                  fieldId: 'custrecord_mts_fiscaltype_taxconsamt',
                  line: a
               })
            });
         }

         // From Auxiliary File
         var auxFilesJs = taxSettlementRec.getValue({
            fieldId: 'custrecord_mts_auxfilesjs_taxsettlem_tmp'
         });

         if (auxFilesJs) {
            try {
               var auxFilesObj = JSON.parse(auxFilesJs);

               // 0150
               if (auxFilesObj._0150AuxFileId){
                  var _0150File = file.load(auxFilesObj._0150AuxFileId);
                  spedObj.block0150List = JSON.parse(_0150File.getContents());
               }

               // D695
               if (auxFilesObj.D695AuxFileId){
                  var d695File = file.load(auxFilesObj.D695AuxFileId);
                  spedObj.blockD695List = JSON.parse(d695File.getContents());
               }

               // E300
               if (auxFilesObj.E300AuxFileId){
                  var e300File = file.load(auxFilesObj.E300AuxFileId);
                  spedObj.blockE300List = JSON.parse(e300File.getContents());
               }

               // CFOP Abstract
               if (auxFilesObj.CFOPAbstrAuxFileId){
                  var cfopAbstrFile = file.load(auxFilesObj.CFOPAbstrAuxFileId);
                  bookObj.CFOPAbstractList = JSON.parse(cfopAbstrFile.getContents());
               }

               // State Abstract
               if (auxFilesObj.StateAbstrAuxFileId){
                  var stateAbstrFile = file.load(auxFilesObj.StateAbstrAuxFileId);
                  bookObj.StateAbstractList = JSON.parse(stateAbstrFile.getContents());
               }
               
            } catch (error) {
               log.debug({title: 'Recovery Auxiliary Files', details: error});
            }
         }

      }

      //NFe annulment and denegation
      function searchingForNFeAnnulmentAndDenegation(taxSettlementRec) {
         var filters = [];
         var startDate = handlingDateForFilter(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_startdate_taxsettlem' }));
         var endDate = handlingDateForFilter(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_enddate_taxsettlem' }));
         var branchCode = taxSettlementRec.getValue({fieldId:'custrecord_mts_branchcode_taxsettlem'});   // LocBr20.05

         appendFilterInArray(filters, ["custrecord_mts_docdate_eletiteminvproc", "within", startDate, endDate]);
         if (branchCode){
            appendFilterInArray(filters, ['custrecord_mts_branch_eletiteminvproc','is', branchCode]);    // LocBr20.05
         }
         appendFilterInArray(filters, ['custrecord_mts_trans_eletiteminvproc', 'anyof', "@NONE@"]);
         appendFilterInArray(filters, ['custrecord_mts_invreason_eletiteminvproc', 'anyof', "5", "6"]);
         appendFilterInArray(filters, ['custrecord_mts_processca_eletiteminvproc', 'is', "F"]);
         appendFilterInArray(filters, ['custrecord_mts_inutprot_eletiteminvproc', 'isnotempty', ""]);

         var elecInvProcessSearch = search.create({
            type: "customrecord_mts_eletiteminvproc",
            filters: filters,
            columns:
               [
                  "internalid",
                  "custrecord_mts_invreason_eletiteminvproc",
                  "custrecord_mts_invno_eletiteminvproc",
                  "custrecord_mts_retcode_eletiteminvproc",
                  "custrecord_mts_fiscaldoc_eletiteminvproc",
                  "custrecord_mts_series_eletiteminvproc",
                  "custrecord_mts_docdate_eletiteminvproc",
                  "custrecord_mts_nfekeyace_eletiteminvproc"
               ]
         });
         var eletrInvProcList = [];

         var resultCount = elecInvProcessSearch.runPaged().count;
         if (resultCount) {
            elecInvProcessSearch.run().each(function (result) {
               var eletrInvProcObj = {};
               eletrInvProcObj.invoiceReason = result.getText({ name: 'custrecord_mts_invreason_eletiteminvproc' }).substr(0, 1);
               eletrInvProcObj.id = result.getValue({ name: 'internalid' });
               eletrInvProcObj.invoiceNo = Number(result.getValue({ name: 'custrecord_mts_invno_eletiteminvproc' }));
               eletrInvProcObj.invoiceNoText = result.getValue({ name: 'custrecord_mts_invno_eletiteminvproc' });		// LocBr20.01
               eletrInvProcObj.fiscDocType = result.getValue({ name: 'custrecord_mts_fiscaldoc_eletiteminvproc' });
               eletrInvProcObj.series = result.getValue({ name: 'custrecord_mts_series_eletiteminvproc' });
               eletrInvProcObj.docDate = result.getValue({ name: 'custrecord_mts_docdate_eletiteminvproc' });
               eletrInvProcObj.docDate = format.parse({
                  type: format.Type.DATE,
                  value: eletrInvProcObj.docDate
               });
               eletrInvProcObj.nfeKeyAccess = result.getValue({ name: 'custrecord_mts_nfekeyace_eletiteminvproc' });
               eletrInvProcObj.returnCode = result.getValue({ name: 'custrecord_mts_retcode_eletiteminvproc' });

               var fiscDocTypeId = result.getValue({ name: 'custrecord_mts_fiscaldoc_eletiteminvproc' });
               var fiscalDocTypeObj = fiscDocTypeId ? getFiscDocTypeFields(fiscDocTypeId) : {};

               eletrInvProcObj.fiscModelCode = fiscDocTypeId ? fiscalDocTypeObj.elecfilecod : ''
               eletrInvProcObj.shipToDoc = fiscDocTypeId ? fiscalDocTypeObj.shiptodocty : ''
               eletrInvProcObj.specie = fiscalDocTypeObj.specie || '';

               eletrInvProcList.push(eletrInvProcObj);
               return true;
            });
         }
         return eletrInvProcList;
      }
      function changeOrCreateBlockLineC100(taxSettlementRec, eletrInvProcList) {
         var invoiceNumberRangeList = getStartAndEndInvoiceNumber(eletrInvProcList);
         for (var i = 0; i < invoiceNumberRangeList.length; i++) {

            var startNumber = Number(invoiceNumberRangeList[i].initialInvoiceNumber);
            var endNumber = Number(invoiceNumberRangeList[i].finalInvoiceNumber);
            var eletrInvProcId = invoiceNumberRangeList[i].eletrInvProcId;

            while (startNumber <= endNumber) {
               var invoiceNumber = recreateInvNoText(startNumber, invoiceNumberRangeList[i].initialInvoiceNumber);			// LocBr20.01			

               var lineNumber = taxSettlementRec.findSublistLineWithValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_summaryinv',
                  fieldId: 'custrecord_mts_docno_summaryinv',
                  value: invoiceNumber
               });

               if (lineNumber <= 0) {
                  var c100Obj = createBlockLineC100Obj(invoiceNumber, eletrInvProcList, eletrInvProcId);

                  if (Object.keys(c100Obj).length)
                     taxSetInsert.insertC100(c100Obj, taxSettlementRec);
               } else {
                  changeBlockLineC100Obj(taxSettlementRec, lineNumber, eletrInvProcList, invoiceNumber);
               }
               startNumber++;
            }
         }

         function getStartAndEndInvoiceNumber(eletrInvProcList) {
            var invoiceNumberRangeList = [];
            for (var i = 0; i < eletrInvProcList.length; i++) {

               if (eletrInvProcList[i].invoiceReason == '5') {
                  var eletInvProcessRec = record.load({
                     type: 'customrecord_mts_eletiteminvproc',
                     id: eletrInvProcList[i].id
                  });
                  var lines = eletInvProcessRec.getLineCount({ sublistId: 'recmachcustrecord_mts_eletinvprocess_unueletinv' });
                  if (lines > 0) {
                     var numericalPart, numericalPartLast;
                     numericalPart = eletInvProcessRec.getSublistValue({
                        sublistId: 'recmachcustrecord_mts_eletinvprocess_unueletinv',
                        fieldId: 'custrecord_mts_nnfiini_unueletinv',
                        line: 0
                     });
                     numericalPartLast = eletInvProcessRec.getSublistValue({
                        sublistId: 'recmachcustrecord_mts_eletinvprocess_unueletinv',
                        fieldId: 'custrecord_mts_nnffim_unueletinv',
                        line: 0
                     });
                  }
               } else { //invoiceReason == 6
                  numericalPart = eletrInvProcList[i].invoiceNo;
                  numericalPartLast = eletrInvProcList[i].invoiceNo;
               }

               invoiceNumberRangeList.push({
                  initialInvoiceNumber: numericalPart,
                  finalInvoiceNumber: numericalPartLast,
                  eletrInvProcId: eletrInvProcList[i].id
               })
            }
            return invoiceNumberRangeList;
         }
         function createBlockLineC100Obj(invoiceNumber, eletrInvProcList, eletrInvProcId) {
            var eletrInvProcFiltered = eletrInvProcList.filter(function (elem) {
               return (elem.invoiceNoText == invoiceNumber)		// LocBr20.01
            });
            var c100Obj = {};
            if (eletrInvProcFiltered.length > 0) {
               c100Obj.invoiceNo = invoiceNumber;
               c100Obj.fiscalBook = true;
               c100Obj.fiscaltype = 2; //output
               c100Obj.docdate = eletrInvProcFiltered[0].docDate;
               c100Obj.postdate = eletrInvProcFiltered[0].docDate;
               c100Obj.seriesub = eletrInvProcFiltered[0].series;
               c100Obj.fiscaldoctype = eletrInvProcFiltered[0].fiscDocType;
               c100Obj.fiscalmodelcod = eletrInvProcFiltered[0].fiscModelCode;
               c100Obj.shiptodoc = eletrInvProcFiltered[0].shipToDoc;
               c100Obj.taxsituation = eletrInvProcFiltered[0].invoiceReason == '5' ? '05' : '04';//invoiceReason == 6
               c100Obj.docno = invoiceNumber;
               c100Obj.einvkey = eletrInvProcFiltered[0].nfeKeyAccess;
               c100Obj._c110List = [];
               c100Obj._c120List = [];
               c100Obj._c141List = [];
               c100Obj._c170List = [];
               c100Obj._c190List = [];
               c100Obj._c195List = [];
            } else {
               var eletrInvProcFiltered = eletrInvProcList.filter(function (elem) {
                  return (elem.id == eletrInvProcId)
               });

               if (eletrInvProcFiltered.length > 0) {
                  c100Obj.invoiceNo = invoiceNumber;
                  c100Obj.fiscalBook = true;
                  c100Obj.fiscaltype = 2; //output
                  c100Obj.docdate = eletrInvProcFiltered[0].docDate;
                  c100Obj.postdate = eletrInvProcFiltered[0].docDate;
                  c100Obj.seriesub = eletrInvProcFiltered[0].series;
                  c100Obj.fiscaldoctype = eletrInvProcFiltered[0].fiscDocType;
                  c100Obj.fiscalmodelcod = eletrInvProcFiltered[0].fiscModelCode;
                  c100Obj.shiptodoc = eletrInvProcFiltered[0].shipToDoc;
                  c100Obj.taxsituation = eletrInvProcFiltered[0].invoiceReason == '5' ? '05' : '04';//invoiceReason == 6
                  c100Obj.docno = invoiceNumber;
                  c100Obj.einvkey = eletrInvProcFiltered[0].nfeKeyAccess;
                  c100Obj._c110List = [];
                  c100Obj._c120List = [];
                  c100Obj._c141List = [];
                  c100Obj._c170List = [];
                  c100Obj._c190List = [];
                  c100Obj._c195List = [];
               }
            }
            return c100Obj;
         }
         function changeBlockLineC100Obj(taxSettlementRec, lineNumber, eletrInvProcList, invoiceNumber) {
            var eletrInvProcFiltered = eletrInvProcList.filter(function (elem) {
               return (elem.invoiceNoText == invoiceNumber)	// LocBr20.01
            });

            if (eletrInvProcFiltered.length > 0) {
               taxSettlementRec.selectLine({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_summaryinv',
                  line: lineNumber
               });
               if (eletrInvProcFiltered[0].invoiceReason == '5')
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettlement_summaryinv',
                     fieldId: 'custrecord_mts_taxsituation_summaryinv',
                     value: '05'
                  });
               else //invoiceReason == 6
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettlement_summaryinv',
                     fieldId: 'custrecord_mts_taxsituation_summaryinv',
                     value: '04'
                  });

               taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettlement_summaryinv' });
            }
         }
      }
      function changeOrCreateBlockLinePercentAbstract(taxSettlementRec, eletrInvProcList) {
         var invoiceNumberRangeList = getStartAndEndInvoiceNumber(eletrInvProcList);
         for (var i = 0; i < invoiceNumberRangeList.length; i++) {

            var startNumber = Number(invoiceNumberRangeList[i].initialInvoiceNumber);
            var endNumber = Number(invoiceNumberRangeList[i].finalInvoiceNumber);
            var eletrInvProcId = invoiceNumberRangeList[i].eletrInvProcId;

            while (startNumber <= endNumber) {
               var invoiceNumber = recreateInvNoText(startNumber, invoiceNumberRangeList[i].initialInvoiceNumber);	// LocBr20.01

               var lineNumber = taxSettlementRec.findSublistLineWithValue({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_summaryinv',
                  fieldId: 'custrecord_mts_docnum_percabstr',
                  value: invoiceNumber
               });

               if (lineNumber <= 0) {
                  var percentAbstractObj = createBlockLinePercentAbstractObj(invoiceNumber, eletrInvProcList, eletrInvProcId);

                  if (Object.keys(percentAbstractObj).length)
                     taxSetInsert.insertPercentAbstract(percentAbstractObj, taxSettlementRec);
               } else {
                  changeBlockLinePercentAbstractObj(taxSettlementRec, lineNumber, eletrInvProcList, invoiceNumber);
               }
               startNumber++;
            }
         }

         function getStartAndEndInvoiceNumber(eletrInvProcList) {
            var invoiceNumberRangeList = [];
            for (var i = 0; i < eletrInvProcList.length; i++) {

               if (eletrInvProcList[i].invoiceReason == '5') {
                  var eletInvProcessRec = record.load({
                     type: 'customrecord_mts_eletiteminvproc',
                     id: eletrInvProcList[i].id
                  });
                  var lines = eletInvProcessRec.getLineCount({ sublistId: 'recmachcustrecord_mts_eletinvprocess_unueletinv' });
                  if (lines > 0) {
                     var numericalPart, numericalPartLast;
                     numericalPart = eletInvProcessRec.getSublistValue({
                        sublistId: 'recmachcustrecord_mts_eletinvprocess_unueletinv',
                        fieldId: 'custrecord_mts_nnfiini_unueletinv',
                        line: 0
                     });
                     numericalPartLast = eletInvProcessRec.getSublistValue({
                        sublistId: 'recmachcustrecord_mts_eletinvprocess_unueletinv',
                        fieldId: 'custrecord_mts_nnffim_unueletinv',
                        line: 0
                     });
                  }
               } else { //invoiceReason == 6
                  numericalPart = eletrInvProcList[i].invoiceNo;
                  numericalPartLast = eletrInvProcList[i].invoiceNo;
               }

               invoiceNumberRangeList.push({
                  initialInvoiceNumber: numericalPart,
                  finalInvoiceNumber: numericalPartLast,
                  eletrInvProcId: eletrInvProcList[i].id
               })
            }
            return invoiceNumberRangeList;
         }
         function createBlockLinePercentAbstractObj(invoiceNumber, eletrInvProcList, eletrInvProcId) {
            var eletrInvProcFiltered = eletrInvProcList.filter(function (elem) {
               return (elem.invoiceNoText == invoiceNumber)	// LocBr20.01
            });
            var percentAbstractObj = {};
            if (eletrInvProcFiltered.length > 0) {
               var returnCodeId = eletrInvProcFiltered[0].returnCode;
               var returnCodeObj = returnCodeId ? getReturnCode(returnCodeId) : {};

               percentAbstractObj.externalDocNo = invoiceNumber;
               percentAbstractObj.tranId = '';
               percentAbstractObj.fiscalType = 2; //output
               percentAbstractObj.postingDate = eletrInvProcFiltered[0].docDate;
               percentAbstractObj.fiscalDocType = eletrInvProcFiltered[0].fiscModelCode;
               percentAbstractObj.specie = eletrInvProcFiltered[0].specie;
               percentAbstractObj.serSubSer = eletrInvProcFiltered[0].series;
               percentAbstractObj.docDate = eletrInvProcFiltered[0].docDate;
               percentAbstractObj.billToPayToNo = '';
               percentAbstractObj.terrCode = '';
               percentAbstractObj.billToPayToName = '';
               percentAbstractObj.IE = '';
               percentAbstractObj.CNPJ = '';
               percentAbstractObj.observations = returnCodeObj.bookObservation || '';  //'NF Inutilizada';
               percentAbstractObj.fiscalValues = [];
               percentAbstractObj.fiscalValues.push({
                  cfopCode: '',
                  observations: returnCodeObj.bookObservation || '',
                  GLAmount: 0,
                  ICMSBasisAmount: 0,
                  ICMSExemptAmount: 0,
                  ICMSOthersAmount: 0,
                  ICMSPerc: 0,
                  ICMSAmount: 0,
                  IPIBasisAmount: 0,
                  IPIExemptAmount: 0,
                  IPIOthersAmount: 0,
                  IPIAmount: 0
               });

            } else {
               var eletrInvProcFiltered = eletrInvProcList.filter(function (elem) {
                  return (elem.id == eletrInvProcId)
               });

               if (eletrInvProcFiltered.length > 0) {
                  var returnCodeId = eletrInvProcFiltered[0].returnCode;
                  var returnCodeObj = returnCodeId ? getReturnCode(returnCodeId) : {};

                  percentAbstractObj.externalDocNo = invoiceNumber;
                  percentAbstractObj.tranId = '';
                  percentAbstractObj.fiscalType = 2; //output
                  percentAbstractObj.postingDate = eletrInvProcFiltered[0].docDate;
                  percentAbstractObj.fiscalDocType = eletrInvProcFiltered[0].fiscModelCode;
                  percentAbstractObj.specie = eletrInvProcFiltered[0].specie;
                  percentAbstractObj.serSubSer = eletrInvProcFiltered[0].series;
                  percentAbstractObj.docDate = eletrInvProcFiltered[0].docDate;
                  percentAbstractObj.billToPayToNo = '';
                  percentAbstractObj.terrCode = '';
                  percentAbstractObj.billToPayToName = '';
                  percentAbstractObj.IE = '';
                  percentAbstractObj.CNPJ = '';
                  percentAbstractObj.observations = returnCodeObj.bookObservation || ''; //'NF Inutilizada';
                  percentAbstractObj.fiscalValues = [];
                  percentAbstractObj.fiscalValues.push({
                     cfopCode: '',
                     observations: returnCodeObj.bookObservation || '',
                     GLAmount: 0,
                     ICMSBasisAmount: 0,
                     ICMSExemptAmount: 0,
                     ICMSOthersAmount: 0,
                     ICMSPerc: 0,
                     ICMSAmount: 0,
                     IPIBasisAmount: 0,
                     IPIExemptAmount: 0,
                     IPIOthersAmount: 0,
                     IPIAmount: 0
                  });
               }
            }
            return percentAbstractObj;
         }
         function changeBlockLinePercentAbstractObj(taxSettlementRec, lineNumber, eletrInvProcList, invoiceNumber) {
            var eletrInvProcFiltered = eletrInvProcList.filter(function (elem) {
               return (elem.invoiceNoText == invoiceNumber)	// LocBr20.01
            });

            if (eletrInvProcFiltered.length > 0) {
               taxSettlementRec.selectLine({
                  sublistId: 'recmachcustrecord_mts_taxsettlement_summaryinv',
                  line: lineNumber
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_fiscaltype_percabstr',
                  value: 2
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_postingdate_percabstr',
                  value: eletrInvProcFiltered[0].docDate ? new Date(eletrInvProcFiltered[0].docDate) : ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_fiscaldoctype_percabstr',
                  value: eletrInvProcFiltered[0].fiscModelCode || ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_especie_percabstr',
                  value: eletrInvProcFiltered[0].specie
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_sersubser_percabstr',
                  value: eletrInvProcFiltered[0].series || ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_docnum_percabstr',
                  value: ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_transaction_percabstr',
                  value: invoiceNumber
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_docdate_percabstr',
                  value: eletrInvProcFiltered[0].docDate ? new Date(eletrInvProcFiltered[0].docDate) : ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_billpaytono_percabstr',
                  value: ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_terrcode_percabstr',
                  value: ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_billpaytoname_percabstr',
                  value: ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_ie_percabstr',
                  value: ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_cnpj_percabstr',
                  value: ''
               });

               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_glamount_percabstr',
                  value: 0
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_cfopcode_percabstr',
                  value: ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_icmsbasamount_percabstr',
                  value: 0
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_icmsexeamount_percabstr',
                  value: 0
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_icmsotheramount_percabstr',
                  value: 0
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_percicms_percabstr',
                  value: 0
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_icmsamount_percabstr',
                  value: 0
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_ipibasisamount_percabstr',
                  value: 0
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_ipiexeamount_percabstr',
                  value: 0
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_ipiothersamount_percabstr',
                  value: 0
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_ipiamount_percabstr',
                  value: 0
               });

               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr',
                  fieldId: 'custrecord_mts_observ_percabstr',
                  value: ''
               });

               taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettlement_summaryinv' });
            }
         }
      }
      function recreateInvNoText(invNoAsNumber, invNoAsText) {
         // LocBr20.01
         var newInvNo = '';
         var remChars = invNoAsText.length - invNoAsNumber.toString().length;

         for (var a = 1; a <= remChars; a++)
            newInvNo += '0';

         newInvNo += invNoAsNumber.toString();

         return newInvNo;
      }


      //Bloco H e K
      function generateBlockH(taxSettlementRec, block0190List, block0200List, block0150List) {
         var taxsettBranchInfoObj = getBranchInformation(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_branchcode_taxsettlem' }));
         var inventoryDate = handlingDateForFilter(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_inventorydate_taxsettlem' }));

         var isBlockH = true;
         var stockList =
            [].concat(
               getOurInventoryList(taxsettBranchInfoObj, inventoryDate, block0190List, block0200List, block0150List, isBlockH),
               getOurInThirdPowerList(taxsettBranchInfoObj, inventoryDate, block0190List, block0200List, block0150List, isBlockH),
               getThirdInOurPowerList(taxsettBranchInfoObj, inventoryDate, block0190List, block0200List, block0150List, isBlockH)
            );

         var blockH005Obj = {}
         if (stockList.length) {
            var inventoryTotal = stockList.reduce(function (total, elem) {
               var amount = Number(elem.amount);
               return total + amount;
            }, 0);

            var inventoryReason = taxSettlementRec.getValue({ fieldId: 'custrecord_mts_invenorytreaso_taxsettlem' });

            blockH005Obj = {
               inventoryDate: inventoryDate,
               inventoryTotal: inventoryTotal,
               inventoryReason: inventoryReason,
               _h010List: stockList
            }
         }

         return blockH005Obj;
      }
      function generateBlockK200(taxSettlementRec, block0190List, block0200List, block0150List) {
         var taxsettBranchInfoObj = getBranchInformation(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_branchcode_taxsettlem' }));
         var endDate = handlingDateForFilter(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_enddate_taxsettlem' }));

         isBlockH = false;
         var stockList =
            [].concat(
               getOurInventoryList(taxsettBranchInfoObj, endDate, block0190List, block0200List, block0150List, isBlockH),
               getOurInThirdPowerList(taxsettBranchInfoObj, endDate, block0190List, block0200List, block0150List, isBlockH),
               getThirdInOurPowerList(taxsettBranchInfoObj, endDate, block0190List, block0200List, block0150List, isBlockH)
            );

         return stockList;
      }
      function runTaskBlockKH(taxSettlObj) {
         if (taxSettlObj.inventoryDate){
            // run Block H
            var taskCreated = task.create({
               taskType: task.TaskType.MAP_REDUCE,
               scriptId: 'customscript_mts_mr_processblockkh',
               params: {
                  'custscript_mts_pblkh_requestobj': JSON.stringify({
                     taxSettlementId: taxSettlObj.id,
                     runBlockK: false,
                     runBlockH: true
                  })
               }
            });
   
            var taskId = taskCreated.submit();
         }else{
            if (taxSettlObj.generateBlockK){
               // run Block K
               var taskCreated = task.create({
                  taskType: task.TaskType.MAP_REDUCE,
                  scriptId: 'customscript_mts_mr_processblockkh',
                  params: {
                     'custscript_mts_pblkh_requestobj': JSON.stringify({
                        taxSettlementId: taxSettlObj.id,
                        runBlockK: true,
                        runBlockH: false
                     })
                  }
               });
      
               var taskId = taskCreated.submit();
            }
         }
      }

      function getItensAccount(filters) {
         if (!filters)
            return [];

         var itensAccountList = [];
         var searchItem = search.create({
            type: "inventoryitem",
            filters: filters,
            columns:
               [
                  search.createColumn({
                     name: 'assetaccount',
                     summary: search.Summary.GROUP
                  })
               ]
         });

         var resultCount = searchItem.runPaged().count;
         if (resultCount) {
            searchItem.run().each(function (result) {
               itensAccountList.push(result.getValue({
                  name: 'assetaccount',
                  summary: search.Summary.GROUP
               }));
               return true;
            });
         }
         return itensAccountList;
      }
      function getLocations(filters) {
         if (!filters)
            return [];

         var locationList = [];
         var searchLocation = search.create({
            type: "location",
            filters: filters,
            columns:
               [
                  'internalid',
               ]
         });

         var resultCount = searchLocation.runPaged().count;
         if (resultCount) {
            searchLocation.run().each(function (result) {
               locationList.push(result.getValue({ name: 'internalid' }));
               return true;
            });
         }
         return locationList;
      }


      function getOurInventoryList(taxsettBranchInfoObj, inventoryDate, block0190List, block0200List, block0150List, isBlockH) {
         var OurInventoryList = searchOurInventory(taxsettBranchInfoObj, inventoryDate, isBlockH);

         var itemList = getStockAndFillBlock0200AndBlock0190AndBlock0150(OurInventoryList, taxsettBranchInfoObj, block0190List, block0200List, block0150List, 'customer');

         return itemList;
      }
      function getOurInThirdPowerList(taxsettBranchInfoObj, inventoryDate, block0190List, block0200List, block0150List, isBlockH) {
         var ourInThirdPowerList = searchOurInThirdPower(taxsettBranchInfoObj, inventoryDate, isBlockH);

         var itemList = getStockAndFillBlock0200AndBlock0190AndBlock0150(ourInThirdPowerList, taxsettBranchInfoObj, block0190List, block0200List, block0150List, 'customer');

         return itemList;
      }
      function getThirdInOurPowerList(taxsettBranchInfoObj, inventoryDate, block0190List, block0200List, block0150List, isBlockH) {
         var ThirdInOurPowerList = searchThirdInOurPower(taxsettBranchInfoObj, inventoryDate, isBlockH);

         var itemList = getStockAndFillBlock0200AndBlock0190AndBlock0150(ThirdInOurPowerList, taxsettBranchInfoObj, block0190List, block0200List, block0150List, 'vendor');

         return itemList;
      }

      function searchOurInventory(taxsettBranchInfoObj, inventoryDate, isBlockH) {
         var itensAccountSameSubsidiaryList = getItensAccount([
            ['subsidiary', 'anyof', taxsettBranchInfoObj.subsidiary],
            "AND",
            ["type", "anyof", "InvtPart"],
         ]);

         var locationSameSubsidiaryList = getLocations([
            ['subsidiary', 'anyof', taxsettBranchInfoObj.subsidiary],
            'AND',
            ['custrecord_mts_locationtype_location', 'anyof', '1'],
         ]);

         var locationFilters = [];
         locationSameSubsidiaryList.forEach(function (elem) {
            if (locationFilters.length)
               locationFilters.push('OR');

            locationFilters.push(['location', 'is', elem]);
         });

         var accountFilters = [];
         itensAccountSameSubsidiaryList.forEach(function (elem) {
            if (accountFilters.length)
               accountFilters.push('OR');

            accountFilters.push(['account.name', 'is', elem]);
         });

         var stockList = [];
         // if(locationFilters.length > 0 || accountFilters.length > 0){
         if (locationFilters.length > 0 && accountFilters.length > 0) {

            var filters = [];
            appendFilterInArray(filters, ['trandate', 'onorbefore', inventoryDate]);
            appendFilterInArray(filters, locationFilters);
            appendFilterInArray(filters, accountFilters);
            appendFilterInArray(filters, ['item', 'noneof', '@NONE@']);
            appendFilterInArray(filters, ["mainline", "is", "F"]);
            appendFilterInArray(filters, ["posting", "is", "T"]);

            if (isBlockH) {
               var addAccount = true;
               var addCustomer = false;
               var addVendor = false;
               var columns = getColumnsStock(addAccount, addCustomer, addVendor);

            } else { //is block K
               appendFilterInArray(filters, ["item.custitem_mts_producttype", "anyof", "2", "3", "4", "5", "6", "7", "8", "12"]);

               var addAccount = false;
               var addCustomer = false;
               var addVendor = false;
               var columns = getColumnsStock(addAccount, addCustomer, addVendor);
            }

            var searchTransaction = search.create({
               type: "transaction",
               filters: filters,
               columns: columns
            });

            var transactionSearchData = searchTransaction.runPaged();

            transactionSearchData.pageRanges.forEach(function (pageRange) {

               var myPage = transactionSearchData.fetch({ index: pageRange.index });
               myPage.data.forEach(function (result) {

                  var inventoryObj = {};
                  var customer = result.getValue({ name: 'internalid', join: "customerMain", summary: "GROUP" });
                  if (customer && customer != '- None -')
                     inventoryObj.entityId = customer;
                  else
                     inventoryObj.entityId = '';
                  inventoryObj.item = result.getValue({ name: 'itemid', join: "item", summary: "GROUP" });
                  inventoryObj.amount = result.getValue({ name: 'amount', summary: "SUM" });
                  inventoryObj.quantity = result.getValue({ name: 'quantity', summary: "SUM" });
                  inventoryObj.locationType = result.getValue({ name: 'custrecord_mts_locationtype_location', join: "location", summary: "GROUP" });
                  inventoryObj.account = result.getValue({ name: 'assetaccount', join: "item", summary: "GROUP" });
                  inventoryObj.unitsType = result.getValue({ name: 'unitstype', join: "item", summary: "GROUP" });
                  inventoryObj.stockUnit = result.getValue({ name: 'stockunit', join: "item", summary: "GROUP" });
                  inventoryObj.ncmCode = result.getValue({ name: 'custitem_mts_ncmcode', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.itemInternalID = result.getValue({ name: 'internalid', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.itemType = result.getValue({ name: 'type', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.cestCode = result.getValue({ name: 'custitem_mts_cestcode', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.productType = result.getValue({ name: 'custitem_mts_producttype', join: "item", summary: "GROUP" }) || '';

                  var stockDescription = result.getValue({ name: 'stockdescription', join: "item", summary: "GROUP" }) || '';
                  var purchaseDescription = result.getValue({ name: 'purchasedescription', join: "item", summary: "GROUP" }) || '';
                  var salesDescription = result.getValue({ name: 'salesdescription', join: "item", summary: "GROUP" }) || '';

                  if (stockDescription && stockDescription != '- None -')
                     inventoryObj.description = stockDescription;
                  else if (purchaseDescription && purchaseDescription != '- None -')
                     inventoryObj.description = purchaseDescription;
                  else if (salesDescription && salesDescription != '- None -')
                     inventoryObj.description = salesDescription;


                  stockList.push(inventoryObj);
                  return true;
               });
            });
         }

         return stockList;
      }
      function searchOurInThirdPower(taxsettBranchInfoObj, inventoryDate, isBlockH) {
         var locationSameSubsidiaryList = getLocations([
            ['subsidiary', 'anyof', taxsettBranchInfoObj.subsidiary],
            'AND',
            ['custrecord_mts_locationtype_location', 'anyof', '2']
         ]);

         var locationFilters = [];
         locationSameSubsidiaryList.forEach(function (elem) {
            if (locationFilters.length)
               locationFilters.push('OR');

            locationFilters.push(['location', 'is', elem]);
         });

         var stockList = [];

         if (locationFilters.length > 0) {
            var filters = [];
            appendFilterInArray(filters, ["type", "anyof", "InvAdjst"]);
            appendFilterInArray(filters, ['custbody_mts_brcreatedfromtrans', 'noneof', '@NONE@']);
            appendFilterInArray(filters, ['item', 'noneof', '@NONE@']);
            appendFilterInArray(filters, ['trandate', 'onorbefore', inventoryDate]);
            appendFilterInArray(filters, locationFilters);
            appendFilterInArray(filters, ["mainline", "is", "F"]);
            appendFilterInArray(filters, ["posting", "is", "T"]);

            if (isBlockH) {
               var addAccount = true;
               var addCustomer = true;
               var addVendor = false;
               var columns = getColumnsStock(addAccount, addCustomer, addVendor);

            } else { //is block K
               appendFilterInArray(filters, ["item.custitem_mts_producttype", "anyof", "2", "3", "4", "5", "6", "7", "8", "12"]);

               var addAccount = false;
               var addCustomer = true;
               var addVendor = false;
               var columns = getColumnsStock(addAccount, addCustomer, addVendor)
            }


            var searchTransaction = search.create({
               type: "transaction",
               filters: filters,
               columns: columns
            });


            var resultCount = searchTransaction.runPaged().count;
            if (resultCount) {
               searchTransaction.run().each(function (result) {
                  // var itemName = result.getValue({name:'itemid',join: "item",summary:"GROUP"});
                  // var idx = ownStock.map(function (item){
                  //     return (item.item == itemName)
                  // }).indexOf(true);

                  // if(idx<0){
                  var inventoryObj = {};
                  inventoryObj.item = result.getValue({ name: 'itemid', join: "item", summary: "GROUP" });
                  inventoryObj.amount = result.getValue({ name: 'amount', summary: "SUM" });
                  inventoryObj.quantity = result.getValue({ name: 'quantity', summary: "SUM" });
                  inventoryObj.locationType = result.getValue({ name: 'custrecord_mts_locationtype_location', join: "location", summary: "GROUP" });
                  inventoryObj.account = result.getValue({ name: 'assetaccount', join: "item", summary: "GROUP" });
                  inventoryObj.unitsType = result.getValue({ name: 'unitstype', join: "item", summary: "GROUP" });
                  inventoryObj.stockUnit = result.getValue({ name: 'stockunit', join: "item", summary: "GROUP" });
                  inventoryObj.ncmCode = result.getValue({ name: 'custitem_mts_ncmcode', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.itemInternalID = result.getValue({ name: 'internalid', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.itemType = result.getValue({ name: 'type', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.cestCode = result.getValue({ name: 'custitem_mts_cestcode', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.productType = result.getValue({ name: 'custitem_mts_producttype', join: "item", summary: "GROUP" }) || '';

                  var stockDescription = result.getValue({ name: 'stockdescription', join: "item", summary: "GROUP" }) || '';
                  var purchaseDescription = result.getValue({ name: 'purchasedescription', join: "item", summary: "GROUP" }) || '';
                  var salesDescription = result.getValue({ name: 'salesdescription', join: "item", summary: "GROUP" }) || '';

                  if (stockDescription && stockDescription != '- None -')
                     inventoryObj.description = stockDescription;
                  else if (purchaseDescription && purchaseDescription != '- None -')
                     inventoryObj.description = purchaseDescription;
                  else if (salesDescription && salesDescription != '- None -')
                     inventoryObj.description = salesDescription;

                  var customer = result.getValue({ name: 'internalid', join: "customerMain", summary: "GROUP" });
                  if (customer && customer != '- None -')
                     inventoryObj.entityId = customer;
                  else
                     inventoryObj.entityId = '';

                  stockList.push(inventoryObj);
                  // }

                  return true;
               });
            }
         }
         return stockList;
      }
      function searchThirdInOurPower(taxsettBranchInfoObj, inventoryDate, isBlockH) {
         var itensAccountSameSubsidiaryList = getItensAccount([
            ['subsidiary', 'anyof', taxsettBranchInfoObj.subsidiary],
            "AND",
            ["type", "anyof", "InvtPart"],
         ]);

         var locationSameSubsidiaryList = getLocations([
            ['subsidiary', 'anyof', taxsettBranchInfoObj.subsidiary],
            'AND',
            ['custrecord_mts_locationtype_location', 'anyof', '3']
         ]);

         var locationFilters = [];
         locationSameSubsidiaryList.forEach(function (elem) {
            if (locationFilters.length)
               locationFilters.push('OR');

            locationFilters.push(['location', 'is', elem]);
         });

         var accountFilters = [];
         itensAccountSameSubsidiaryList.forEach(function (elem) {
            if (accountFilters.length)
               accountFilters.push('OR');

            accountFilters.push(['account.name', 'is', elem]);
         });

         var stockList = [];

         if (locationFilters.length > 0 && accountFilters.length > 0) {
            var filters = [];
            appendFilterInArray(filters, ['trandate', 'onorbefore', inventoryDate]);
            appendFilterInArray(filters, locationFilters);
            appendFilterInArray(filters, accountFilters);
            appendFilterInArray(filters, ['item', 'noneof', '@NONE@']);
            appendFilterInArray(filters, ["mainline", "is", "F"]);
            appendFilterInArray(filters, ["posting", "is", "T"]);

            if (isBlockH) {
               var addAccount = true;
               var addCustomer = false;
               var addVendor = true;
               var columns = getColumnsStock(addAccount, addCustomer, addVendor);

            } else { //is block K
               appendFilterInArray(filters, ["item.custitem_mts_producttype", "anyof", "2", "3", "4", "5", "6", "7", "8", "12"]);

               var addAccount = false;
               var addCustomer = false;
               var addVendor = true;
               var columns = getColumnsStock(addAccount, addCustomer, addVendor)
            }

            var searchTransaction = search.create({
               type: "transaction",
               filters: filters,
               columns: columns
            });


            var resultCount = searchTransaction.runPaged().count;
            if (resultCount) {
               searchTransaction.run().each(function (result) {
                  var inventoryObj = {};
                  var vendor = result.getValue({ name: 'internalid', join: "vendor", summary: "GROUP" });
                  if (vendor && vendor != '- None -')
                     inventoryObj.entityId = vendor;
                  else
                     inventoryObj.entityId = '';
                  inventoryObj.item = result.getValue({ name: 'itemid', join: "item", summary: "GROUP" });
                  inventoryObj.amount = result.getValue({ name: 'amount', summary: "SUM" });
                  inventoryObj.quantity = result.getValue({ name: 'quantity', summary: "SUM" });
                  inventoryObj.locationType = result.getValue({ name: 'custrecord_mts_locationtype_location', join: "location", summary: "GROUP" });
                  inventoryObj.account = result.getValue({ name: 'assetaccount', join: "item", summary: "GROUP" });
                  inventoryObj.unitsType = result.getValue({ name: 'unitstype', join: "item", summary: "GROUP" });
                  inventoryObj.stockUnit = result.getValue({ name: 'stockunit', join: "item", summary: "GROUP" });
                  inventoryObj.ncmCode = result.getValue({ name: 'custitem_mts_ncmcode', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.itemInternalID = result.getValue({ name: 'internalid', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.itemType = result.getValue({ name: 'type', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.cestCode = result.getValue({ name: 'custitem_mts_cestcode', join: "item", summary: "GROUP" }) || '';
                  inventoryObj.productType = result.getValue({ name: 'custitem_mts_producttype', join: "item", summary: "GROUP" }) || '';

                  var stockDescription = result.getValue({ name: 'stockdescription', join: "item", summary: "GROUP" }) || '';
                  var purchaseDescription = result.getValue({ name: 'purchasedescription', join: "item", summary: "GROUP" }) || '';
                  var salesDescription = result.getValue({ name: 'salesdescription', join: "item", summary: "GROUP" }) || '';

                  if (stockDescription && stockDescription != '- None -')
                     inventoryObj.description = stockDescription;
                  else if (purchaseDescription && purchaseDescription != '- None -')
                     inventoryObj.description = purchaseDescription;
                  else if (salesDescription && salesDescription != '- None -')
                     inventoryObj.description = salesDescription;


                  stockList.push(inventoryObj);
                  return true;
               });
            }
         }
         return stockList;
      }

      function getStockAndFillBlock0200AndBlock0190AndBlock0150(stockList, taxsettBranchInfoObj, block0190List, block0200List, block0150List, entityType) {
         var itemList = [];
         var _0150List = [];
         var _0190List = [];
         var _0200List = [];

         for (var i = 0; i < stockList.length; i++) {
            var unitCode = '';
            unitMeasureObj = {};

            if (stockList[i].unitsType) {
               var unitMeasureRec = record.load({ type: 'unitstype', id: stockList[i].unitsType });
               var line = unitMeasureRec.findSublistLineWithValue({ sublistId: 'uom', fieldId: 'internalid', value: stockList[i].stockUnit });

               var quantity = stockList[i].quantity;
               quantity /= unitMeasureRec.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: line });
               unitCode = unitMeasureRec.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: line });
               unitMeasureObj = getUnitMeasure(unitCode);
            }

            var accountNumber = getAccountNumber(stockList[i].account);
            var validateQuantity = (quantity > 0);

            if (validateQuantity) {
               itemList.push({
                  entityId: stockList[i].entityId || '',
                  item: stockList[i].item,
                  amount: Math.abs(stockList[i].amount),
                  quantity: quantity,
                  unitCode: unitMeasureObj.unitMeasureCode,
                  locationType: stockList[i].locationType,
                  account: accountNumber
               });
               setBlock0150(stockList[i].entityId, entityType, taxsettBranchInfoObj, _0150List);
               setBlock0190(unitMeasureObj, _0190List);
               setBlock0200(stockList[i], taxsettBranchInfoObj, unitMeasureObj, _0200List);
            }
         }

         _0150List.forEach(function (_blc0150) {
            summarizeBlock0150(_blc0150, block0150List);
         });

         summarizeBlock0190(_0190List, block0190List);
         summarizeBlock0200(_0200List, block0200List);

         return itemList;
      }
      function setBlock0200(itemObj, taxsettBranchInfoObj, unitMeasureObj, _0200List) {
         if (!Object.keys(itemObj).length)
            return;

         var _0200Obj = {};


         var productTypeId = itemObj.productType;
         var internalId = itemObj.itemInternalID;
         var type = itemObj.itemType;
         var cestCode = itemObj.cestCode || '';

         _0200Obj.type = type;
         _0200Obj.prodOrderNo = itemObj.item;
         _0200Obj.itemType = getProductTypeName(productTypeId);
         _0200Obj.itemCode = internalId;
         _0200Obj.servicecode = internalId;
         _0200Obj.description = itemObj.description;
         _0200Obj.descriptionTwo = '';
         _0200Obj.cestCode = cestCode;
         _0200Obj._0220Obj = {};

         var ncmCode = itemObj.ncmCode;
         var tariffNumberObj = ncmCode ? getTariffNumber(ncmCode) : {};

         if (Object.keys(tariffNumberObj).length) {
            _0200Obj.excCodeNbmSh = tariffNumberObj.excncmcode;
            _0200Obj.nbmSh = tariffNumberObj.id;
         } else {
            _0200Obj.excCodeNbmSh = '';
            _0200Obj.nbmSh = '';
         }

         if (Object.keys(unitMeasureObj).length)
            _0200Obj.unitofmeasure = unitMeasureObj.unitMeasureCode || '';
         else
            _0200Obj.unitofmeasure = '';

         if (Object.keys(taxsettBranchInfoObj).length)
            _0200Obj.icmsPerc = getICMSinternalSPED(taxsettBranchInfoObj.territory.id, internalId);
         else
            _0200Obj.icmsPerc = '';


         _0200List.push(_0200Obj);
      }
      function setBlock0190(unitMeasureObj, _0190List) {
         if (Object.keys(unitMeasureObj).length) {
            if (unitMeasureObj.unitMeasureCode) {
               var _0190Obj = {};
               _0190Obj.code = unitMeasureObj.code;
               _0190Obj.description = unitMeasureObj.description;
               _0190Obj.unitMeasureCode = unitMeasureObj.unitMeasureCode;

               _0190List.push(_0190Obj);
            }
         }
      }
      function setBlock0150(entityId, entityType, taxsettBranchInfoObj, _0150List) {
         if (!entityId)
            return;

         var entityRec = record.load({
            type: entityType,
            id: entityId
         });

         var countriesObj = getAddressObj(entityRec);
         var _0150Obj = {};

         _0150Obj.code = entityRec.id;
         var entityName;

         var isPerson = entityRec.getValue({ fieldId: 'isperson' })
         if (isPerson == 'T') {
            entityName = entityRec.getValue({ fieldId: 'firstname' });
            entityName += ' ' + entityRec.getValue({ fieldId: 'middlename' });
            entityName += ' ' + entityRec.getValue({ fieldId: 'lastname' });

         } else {
            entityName = entityRec.getValue({ fieldId: 'companyname' });
         }

         _0150Obj.description = entityName;
         _0150Obj.category = entityRec.getValue({ fieldId: 'custentity_mts_categoryloc' });
         _0150Obj.suframa = entityRec.getValue({ fieldId: 'custentity_mts_suframacode' });
         _0150Obj.branchCode = taxsettBranchInfoObj.id;
         _0150Obj.countryCode = countriesObj.bacenCountryCode;
         _0150Obj.address = countriesObj.address;
         _0150Obj.ibgeCityCode = countriesObj.ibgeCityCode;
         _0150Obj.number = countriesObj.number;
         _0150Obj.address2 = countriesObj.address2;
         _0150Obj.district = countriesObj.district;

         var category = entityRec.getValue({ fieldId: 'custentity_mts_categoryloc' });
         if (category == 1) {    //person
            _0150Obj.cpf = entityRec.getValue({ fieldId: 'custentity_mts_cnpjcpf' }).replace(/\D/g, '');
            _0150Obj.cnpj = '';
         } else if (category == 2) {    //company
            _0150Obj.cnpj = entityRec.getValue({ fieldId: 'custentity_mts_cnpjcpf' }).replace(/\D/g, '');
            _0150Obj.cpf = '';
         } else {
            _0150Obj.cpf = '';
            _0150Obj.cnpj = '';
         }

         var ie = entityRec.getValue({ fieldId: 'custentity_mts_ie' });

         if (ie == 'ISENTO')
            _0150Obj.ie = '';
         else
            _0150Obj.ie = ie;

         _0150Obj._0175List = '';

         _0150List.push(_0150Obj);
      }

      function getColumnsStock(addAccount, addCustomer, addVendor) {
         var columns = [
            search.createColumn({
               name: "amount",
               summary: "SUM",
               label: "Amount"
            }),
            search.createColumn({
               name: "quantity",
               summary: "SUM",
               label: "Quantity"
            }),
            search.createColumn({
               name: "custrecord_mts_locationtype_location",
               join: "location",
               summary: "GROUP",
               label: "Location Type"
            }),
            search.createColumn({
               name: "itemid",
               join: "item",
               summary: "GROUP",
               label: "Name"
            }),
            search.createColumn({
               name: "unitstype",
               join: "item",
               summary: "GROUP",
               label: "Units Type"
            }),
            search.createColumn({
               name: "stockunit",
               join: "item",
               summary: "GROUP",
               label: "Stock Unit"
            }),
            search.createColumn({
               name: "internalid",
               join: "item",
               summary: "GROUP",
               label: "Internal ID"
            }),
            search.createColumn({
               name: "type",
               join: "item",
               summary: "GROUP",
               label: "Type"
            }),
            search.createColumn({
               name: "custitem_mts_ncmcode",
               join: "item",
               summary: "GROUP",
               label: "NCM Code."
            }),
            search.createColumn({
               name: "custitem_mts_cestcode",
               join: "item",
               summary: "GROUP",
               label: "CEST Code"
            }),
            search.createColumn({
               name: "custitem_mts_producttype",
               join: "item",
               summary: "GROUP",
               label: "Product Type"
            }),
            search.createColumn({
               name: "stockdescription",
               join: "item",
               summary: "GROUP",
               label: "Stock Description"
            }),
            search.createColumn({
               name: "purchasedescription",
               join: "item",
               summary: "GROUP",
               label: "Purchase Description"
            }),
            search.createColumn({
               name: "salesdescription",
               join: "item",
               summary: "GROUP",
               label: "Sales Description"
            }),
         ];

         if (addAccount)
            columns.push(
               search.createColumn({
                  name: "assetaccount",
                  join: "item",
                  summary: "GROUP",
                  label: "Asset Account"
               })
            );

         if (addCustomer)
            columns.push(
               search.createColumn({
                  name: "internalid",
                  join: "customerMain",
                  summary: "GROUP",
                  label: "Internal ID"
               })
            );

         if (addVendor)
            columns.push(
               search.createColumn({
                  name: "internalid",
                  join: "vendor",
                  summary: "GROUP",
                  label: "Internal ID"
               })
            );

         return columns;
      }
      function getAccountNumber(accountName) {
         if (!accountName)
            return '';

         var accountSearch = search.create({
            type: 'account',
            filters:
               [
                  ["name", "is", accountName]
               ],
            columns:
               [
                  "custrecord_mts_localno_account"
               ]
         });
         var accountNumber = '';

         var resultCount = accountSearch.runPaged().count;
         if (resultCount) {
            accountSearch.run().each(function (result) {
               accountNumber = result.getValue({ name: 'custrecord_mts_localno_account' });
               return false;
            })
         }

         return accountNumber;
      }
      function getProductTypeName(productTypeId) {
         if (!productTypeId)
            return '';

         var productTypeLookup = search.lookupFields({
            type: 'customrecord_mts_producttype',
            id: productTypeId,
            columns: [
               'name'
            ]
         });

         if (typeof productTypeLookup.name == 'string')
            return productTypeLookup.name;
         else
            return '';
      }

      //Bloco 1
      function generateBlock1100(taxSettlementRec, block0190List, block0200List) {
         var taxsettBranchInfoObj = getBranchInformation(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_branchcode_taxsettlem' }));
         var startDate = handlingDateForFilter(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_startdate_taxsettlem' }));
         var endDate = handlingDateForFilter(taxSettlementRec.getValue({ fieldId: 'custrecord_mts_enddate_taxsettlem' }));

         var _1100List = [];
         var _0190List = [];
         var _0200List = [];

         var exportTransacList = searchExportTransaction(startDate, endDate);
         for (var i = 0; i < exportTransacList.length; i++) {
            _1100List.push(getBlock1100(exportTransacList[i]));
            _0200List.push(getBlock0200(exportTransacList[i], taxsettBranchInfoObj, _0190List));
         }

         summarizeBlock0190(_0190List, block0190List);
         summarizeBlock0200(_0200List, block0200List);

         return _1100List;
      }
      function searchExportTransaction(startDate, endDate) {
         var filters = [];

         appendFilterInArray(filters, ["custbody_mts_entrydatashipmentadvice", "within", startDate, endDate]);
         appendFilterInArray(filters, ['type', 'anyof', 'CustInvc', 'VendCred', '']);
         appendFilterInArray(filters, ['custbody_mts_creditreturn', 'noneof', '2']);
         appendFilterInArray(filters, ['item', 'noneof', '@NONE@']);
         appendFilterInArray(filters, ['unit', 'noneof', '@NONE@']);
         appendFilterInArray(filters, ["mainline", "is", "F"]);
         appendFilterInArray(filters, ["posting", "is", "T"]);

         var transactionSearch = search.create({
            type: 'transaction',
            filters: filters,
            columns:
               [
                  'internalid',
                  'recordtype',
                  'custbody_document_date',
                  'custbody_mts_exportdoctype',
                  'custbody_mts_ddeno',
                  'custbody_mts_ddedate',
                  'custbody_mts_reno',
                  'custbody_mts_redate',
                  'custbody_mts_shipmentadvice',
                  'custbody_mts_datashipmentadvice',
                  'custbody_mts_entrydatashipmentadvice',
                  'custbody_mts_shipmentadvicetype',
                  'custbody_mts_fiscaldocumentype',
                  'custbody_mts_printserie',
                  'custbody_mts_externaldocno',
                  'custbody_mts_keynfe',
                  'custbody_mts_nfekeyaccessthirdissue',
                  'unit',
                  'quantity',
                  'item.unitstype',
                  'item.stockunit',
                  'item.itemid',
                  'item.internalid',
                  'item.type',
                  'item.custitem_mts_ncmcode',
                  'item.custitem_mts_cestcode',
                  'item.custitem_mts_producttype',
                  'item.custitem_mts_producttype',
                  'item.stockdescription',
                  'item.purchasedescription',
                  'item.salesdescription',
                  'billingAddress.country'
               ]
         });

         var transactionList = [];

         var resultCount = transactionSearch.runPaged().count;
         if (resultCount) {
            transactionSearch.run().each(function (result) {
               var transactionObj = {};

               transactionObj.unit = result.getValue({ name: 'unit' }) || '';

               transactionObj.internalId = result.getValue({ name: 'internalid' }) || '';
               transactionObj.recordType = result.getValue({ name: 'recordtype' }) || '';
               transactionObj.exportDocType = result.getValue({ name: 'custbody_mts_exportdoctype' }) || '';
               transactionObj.ddeNo = result.getValue({ name: 'custbody_mts_ddeno' }) || '';
               transactionObj.ddeDate = result.getValue({ name: 'custbody_mts_ddedate' }) || '';
               transactionObj.reNo = result.getValue({ name: 'custbody_mts_reno' }) || '';
               transactionObj.reDate = result.getValue({ name: 'custbody_mts_redate' }) || '';
               transactionObj.shipmentAdvice = result.getValue({ name: 'custbody_mts_shipmentadvice' }) || '';
               transactionObj.dataShipmentAdvice = result.getValue({ name: 'custbody_mts_datashipmentadvice' }) || '';
               transactionObj.entryDateShipmentAdvice = result.getValue({ name: 'custbody_mts_entrydatashipmentadvice' }) || '';
               transactionObj.shipmentAdviceType = result.getValue({ name: 'custbody_mts_shipmentadvicetype' }) || '';
               transactionObj.billingAddressCountry = result.getValue({ name: 'countrycode', join: 'billingAddress' }) || '';

               transactionObj.fiscDocType = result.getValue({ name: 'custbody_mts_fiscaldocumentype' }) || '';
               transactionObj.serie = result.getValue({ name: 'custbody_mts_printserie' }) || '';
               transactionObj.externalDocNo = result.getValue({ name: 'custbody_mts_externaldocno' }) || '';
               transactionObj.keyAccess = result.getValue({ name: 'custbody_mts_keynfe' }) || '';
               transactionObj.nfeKeyAccessThirdIssue = result.getValue({ name: 'custbody_mts_nfekeyaccessthirdissue' }) || '';
               transactionObj.docDate = result.getValue({ name: 'custbody_document_date' }) || '';




               transactionObj.itemObj = {};
               transactionObj.itemObj.item = result.getValue({ name: 'itemid', join: 'item' }) || '';
               transactionObj.itemObj.ncmCode = result.getValue({ name: 'custitem_mts_ncmcode', join: "item" }) || '';
               transactionObj.itemObj.id = result.getValue({ name: 'internalid', join: "item" }) || '';
               transactionObj.itemObj.type = result.getValue({ name: 'type', join: "item" }) || '';
               transactionObj.itemObj.cestCode = result.getValue({ name: 'custitem_mts_cestcode', join: "item" }) || '';
               transactionObj.itemObj.productType = result.getValue({ name: 'custitem_mts_producttype', join: "item" }) || '';
               transactionObj.itemObj.unitsType = result.getValue({ name: 'unitstype', join: "item" }) || '';
               transactionObj.itemObj.stockUnit = result.getValue({ name: 'stockunit', join: "item" }) || '';

               var stockDescription = result.getValue({ name: 'stockdescription', join: "item" }) || '';
               var purchaseDescription = result.getValue({ name: 'purchasedescription', join: "item" }) || '';
               var salesDescription = result.getValue({ name: 'salesdescription', join: "item" }) || '';

               if (stockDescription && stockDescription != '- None -')
                  transactionObj.itemObj.description = stockDescription;

               else if (purchaseDescription && purchaseDescription != '- None -')
                  transactionObj.itemObj.description = purchaseDescription;

               else if (salesDescription && salesDescription != '- None -')
                  transactionObj.itemObj.description = salesDescription;

               transactionList.push(transactionObj)
               return true;
            })
         }
         return transactionList;
      }
      function getBlock0190(unitMeasureObj) {

         var _0190Obj = {};
         if (Object.keys(unitMeasureObj).length && unitMeasureObj.unitMeasureCode) {

            _0190Obj.code = unitMeasureObj.code || '';
            _0190Obj.description = unitMeasureObj.description;
            _0190Obj.unitMeasureCode = unitMeasureObj.unitMeasureCode;
         }

         return _0190Obj;
      }
      function getBlock0200(transactionObj, branchCodeObj, _0190List) {
         var _0200Obj = {}

         if (Object.keys(transactionObj.itemObj).length) {

            var itemObj = transactionObj.itemObj;
            var prodType = getProductTypeName(itemObj.productType);

            var unitMeasureRec = record.load({ type: 'unitstype', id: itemObj.unitsType });
            var line = unitMeasureRec.findSublistLineWithValue({ sublistId: 'uom', fieldId: 'internalid', value: itemObj.stockUnit });
            var unitCode = unitMeasureRec.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: line });

            var unitMeasureObj = unitCode ? getUnitMeasure(unitCode) : {};
            var tariffNumberObj = itemObj.ncmCode ? getTariffNumber(itemObj.ncmCode) : {};

            if (Object.keys(branchCodeObj).length)
               var icmsPerc = getICMSinternalSPED(branchCodeObj.territory.id, itemObj.id);

            _0200Obj.type = itemObj.type || '';
            _0200Obj.prodOrderNo = itemObj.item || '';
            _0200Obj.itemType = prodType || '';
            _0200Obj.itemCode = itemObj.id;
            _0200Obj.servicecode = itemObj.id;
            _0200Obj.description = itemObj.description;
            _0200Obj.descriptionTwo = '';
            _0200Obj.cestCode = itemObj.cestCode;
            _0200Obj.excCodeNbmSh = tariffNumberObj.excncmcode || '';
            _0200Obj.nbmSh = tariffNumberObj.id || '';
            _0200Obj.icmsPer = icmsPerc || '';
            _0200Obj.unitofmeasure = unitMeasureObj.unitMeasureCode || '';
            _0200Obj._0220Obj = {};

            if ((itemObj.type == 'inventoryitem' && transactionObj.unit != itemObj.stockUnit) ||
               (itemObj.type != 'inventoryitem' && transactionObj.unit != itemObj.baseUnit))
               _0200Obj._0220Obj = getBlock0220(transactionObj);

            _0190List.push(getBlock0190(unitMeasureObj))
         }
         return _0200Obj;
      }
      function getBlock0220(transactionObj) {
         var _0220Obj = {};

         if (Object.keys(transactionObj).length) {
            var unitMeasureRec = record.load({ type: 'unitstype', id: transactionObj.itemObj.unitsType });
            var lineNumber = unitMeasureRec.findSublistLineWithValue({ sublistId: 'uom', fieldId: 'internalid', value: transactionObj.unit });

            var code = unitMeasureRec.getSublistValue({
               sublistId: 'uom',
               fieldId: 'abbreviation',
               line: lineNumber
            });

            var qtyUnitMeasure = unitMeasureRec.getSublistValue({
               sublistId: 'uom',
               fieldId: 'conversionrate',
               line: lineNumber
            });

            _0220Obj.code = code || '';
            _0220Obj.qtyUnitMeasure = qtyUnitMeasure || '';
         }

         return _0220Obj;
      }
      function getBlock1100(transactionObj) {
         var _1100Obj = {};

         _1100Obj.exportDocType = transactionObj.exportDocType;
         _1100Obj.ddeNo = transactionObj.ddeNo;
         _1100Obj.ddeDate = transactionObj.ddeDate ? handlingDateForField(transactionObj.ddeDate) : '';
         _1100Obj.reNo = transactionObj.reNo;
         _1100Obj.reDate = transactionObj.reDate ? handlingDateForField(transactionObj.reDate) : '';
         _1100Obj.shipmentAdvice = transactionObj.shipmentAdvice;
         _1100Obj.dataShipmentAdvice = transactionObj.dataShipmentAdvice ? handlingDateForField(transactionObj.dataShipmentAdvice) : '';
         _1100Obj.entryDateShipmentAdvice = transactionObj.entryDateShipmentAdvice ? handlingDateForField(transactionObj.entryDateShipmentAdvice) : '';
         _1100Obj.shipmentAdviceType = transactionObj.shipmentAdviceType;
         _1100Obj.siscomex = '';

         var countriesRef = transactionObj.billingAddressCountry;
         if (countriesRef) {
            var countriesSearch = search.create({
               type: "customrecord_mts_countries",
               filters: [
                  ['idtext', 'is', countriesRef]
               ],
               columns:
                  [
                     "custrecord_mts_siscomexcountry_countries"
                  ]
            });

            var resultCount = countriesSearch.runPaged().count;
            if (resultCount) {
               countriesSearch.run().each(function (result) {
                  _1100Obj.siscomex = result.getValue({ name: 'custrecord_mts_siscomexcountry_countries' })
                  return false;
               })
            }
         }

         _1100Obj._1105List = [];
         _1100Obj._1105List.push(getBlock1105(transactionObj));


         return _1100Obj;
      }
      function getBlock1105(transactionObj) {
         var _1105Obj = [];
         _1105Obj.fiscDocType = transactionObj.fiscDocType;
         _1105Obj.serie = transactionObj.serie;
         _1105Obj.externalDocNo = transactionObj.externalDocNo;
         _1105Obj.docDate = transactionObj.docDate ? handlingDateForField(transactionObj.docDate) : '';
         _1105Obj.item = '';
         _1105Obj.nfeKeyAccess = '';


         if (Object.keys(transactionObj.itemObj).length)
            _1105Obj.item = transactionObj.itemObj.item;


         if (transactionObj.keyAccess)
            _1105Obj.nfeKeyAccess = transactionObj.keyAccess;
         else if (transactionObj.nfeKeyAccessThirdIssue)
            _1105Obj.nfeKeyAccess = transactionObj.nfeKeyAccessThirdIssue;

         return _1105Obj
      }

      return {
         // config:{
         //     retryCount: 0,
         //     exitOnError: true
         // },
         getInputData: getInputData,
         map: map,
         reduce: reduce,
         summarize: summarize
      }
   });