/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

/*
yyyy.mm.dd  Developer   Ref/Task    Version         Description
------------------------------------------------------------------------------------------------------------------------------------
2020.09.08  BS          1559        LocBr20.01      Applied improvements for performance
2020.10.19  IN          1641        LocBr20.02      Function created to update the fields of the items that are with the Unit Price BR 0.
2020.10.29  IN          1744        LocBr20.03      Replacing the API getSubRecord to hasSubrecord.
2021.03.08  LF          1825        LocBr20.04      Add Validations to save transaction.
2021.11.11  LF          4288        LocBr21.01      Add Validations to save transaction.
*/

define([
   'N/ui/message',
   'N/record',
   'N/currentRecord',
   'N/url',
   'N/https',
   'N/runtime',
   'N/search',
   './Script_SalesPurchase_Messages.js',
   './Script_SalesPurchase_Functions.js',
   "./AssignDocumentCharges/Script_AssignDocumentCharges.js",
   './TaxCalculation/Script_TaxCalculate.js'
],

   function (
      message,
      record,
      currentrec,
      url,
      https,
      runtime,
      search,
      salespurchmessages,
      salespurchfunctions,
      assigndoccharges,
      taxcalculate
   ) {

      var OperationTypeObj = { id: "" };
      var EntityRec = { id: "" };
      var FiscalDocTypeObj = { id: "" };
      var PaymentMethodObj = { id: "" };
      var ItemObj = { type: "", id: "" };
      var haveItemFieldChanged = false;

      function pageInit(scriptContext) {
         salespurchfunctions.onPageInit(scriptContext);
      }

      function saveRecord(scriptContext) {
         var validateReturn = true;
         var currentRec = scriptContext.currentRecord;

         try {
            var presenceIndicator = currentRec.getValue({ fieldId: "custbody_mts_presenceindicatorbuyer" });
            var presenceIndicatorText = currentRec.getText({ fieldId: "custbody_mts_presenceindicatorbuyer" });
            var intermediary = currentRec.getValue({ fieldId: "custbody_mts_supplierintermtransac" }) ;
            var fiscalDocTypeId = currentRec.getValue({ fieldId: "custbody_mts_fiscaldocumentype" });

            var fiscalLookup = search.lookupFields({
               type: 'customrecord_mts_fiscaldoctype',
               id: fiscalDocTypeId,
               columns: [
                  'custrecord_mts_elecfilecod_fiscaldoctype',
                  'custrecord_mts_typenfthree_fiscaldoctype'
               ]
            })

            var electronicFileCode = fiscalLookup.custrecord_mts_elecfilecod_fiscaldoctype
            if (fiscalLookup.custrecord_mts_typenfthree_fiscaldoctype.length > 0)
               var typeNf3e = fiscalLookup.custrecord_mts_typenfthree_fiscaldoctype[0].text.substr(0, 1) || '';
            
            if (presenceIndicator == '1' || presenceIndicator == '6') {
               if(intermediary) {
                  throw new Error(salespurchmessages.getText00048(presenceIndicatorText))
               }
               return true
            } else if( electronicFileCode == '57' || electronicFileCode == '63' || electronicFileCode == '68'){
               var originIBGE = currentRec.getValue({ fieldId: "custbody_mts_originibgecitycode" });
               var originIBGELabel = currentRec.getField({ fieldId: "custbody_mts_originibgecitycode" }).label;
               var destinationIBGE = currentRec.getValue({ fieldId: "custbody_mts_destinationibgecitycode" });
               var destinationIBGELabel = currentRec.getField({ fieldId: "custbody_mts_destinationibgecitycode" }).label;

               if(!originIBGE || !destinationIBGE){
                  throw new Error(salespurchmessages.getText00053(originIBGELabel, destinationIBGELabel))
               }
               return true
            }else if( typeNf3e == '2' && electronicFileCode == '06'){
               var hashSubsDoc = currentRec.getValue({ fieldId: "custbody_mts_hashsubsdocument" });
               var hashSubsDocLabel = currentRec.getField({ fieldId: "custbody_mts_hashsubsdocument" }).label;

               if(!hashSubsDoc){
                  throw new Error(salespurchmessages.getText00054(hashSubsDocLabel))
               }
               return true
            }else if( typeNf3e == '2' && electronicFileCode == '66'){
               var nfeKeyAccessThirdIssue = currentRec.getValue({ fieldId: "custbody_mts_nfekeyaccessthirdissue" });
               var nfeKeyAccessThirdIssueLabel = currentRec.getField({ fieldId: "custbody_mts_nfekeyaccessthirdissue" }).label;

               if(!nfeKeyAccessThirdIssue){
                  throw new Error(salespurchmessages.getText00054(nfeKeyAccessThirdIssueLabel))
               }
               return true
            }
            validateReturn = salespurchfunctions.onSaveRecord(scriptContext, OperationTypeObj, FiscalDocTypeObj, PaymentMethodObj);

         } catch (ex) {
            message.create({
               title: "ERROR",
               message: ex.message,
               type: message.Type.ERROR
            }).show({ duration: 20000 });
            return false;
         }

         return validateReturn;
      }

      function validateField(scriptContext) {
         var currentRec = scriptContext.currentRecord;
         var currentField = scriptContext.fieldId;
         var currentSublist = scriptContext.sublistId;
         var validateReturn = true;

         var ObjHeader = {};
         ObjHeader.FiscalDocumentType = {};
         ObjHeader.OperationType = {};
         ObjHeader.RecordType = currentRec.type;

         try {

            if (currentSublist == "item") {
               if (currentField == "item") {
                  validateReturn = salespurchfunctions.onVF_Item_Item(scriptContext);
               }
            } else if (currentField == "custbody_mts_importationtype") {
               validateReturn = salespurchfunctions.onVF_Main_ImportationType(scriptContext);
            } else if (currentField == "custbody_mts_freeofcharge") {
               validateReturn = salespurchfunctions.onVF_Main_FreeOfCharge(scriptContext);
            } else if (currentField == "custbody_mts_paymentmethodcode") {
               validateReturn = salespurchfunctions.onVF_Main_PaymentMethod(scriptContext, ObjHeader);
            } else if (currentField == "custbody_mts_invoicetocomplement") {
               validateReturn = salespurchfunctions.onVF_Main_InvoiceToComplement(scriptContext, ObjHeader);
            } else if (currentField == "custbody_mts_operationtype") {
               validateReturn = salespurchfunctions.onVF_Main_OperationType(scriptContext, ObjHeader, OperationTypeObj);
            }
         } catch (ex) {
            alert(ex.message);
            console.error(ex);
            return false;
         }

         return validateReturn;
      }

      function fieldChanged(scriptContext) {
         var currentRec = scriptContext.currentRecord;
         var currentField = scriptContext.fieldId;
         var currentSublist = scriptContext.sublistId;
         var ObjHeader = {};
         // console.log('fieldchange', currentField)

         if (currentSublist == "item") {
            if (currentField == "custcol_mts_cofinsperc" || currentField == "custcol_mts_cofinsbasis") {
               // console.log("custcol_mts_cofinsperc")
               salespurchfunctions.calculateCOFINSAmount(currentRec);
            } else if (currentField == "custcol_mts_pisperc" || currentField == "custcol_mts_pisbasis") {
               // console.log("custcol_mts_pisperc")

               salespurchfunctions.calculatePISAmount(currentRec);
            } else if (currentField == "custcol_mts_pisamount") {
               // console.log("custcol_mts_pisamount")

               salespurchfunctions.calculateRateByPisAmount(currentRec);
            } else if (currentField == "custcol_mts_cofinsamount") {
               // console.log("custcol_mts_cofinsamount")

               salespurchfunctions.calculateRateByCofinsAmount(currentRec);
            } else if (currentField == "quantity") {
               // console.log("quantity")

               currentRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_mts_cofinsbasis",
                  value: 0,
                  ignoreFieldChange: true
               });
               currentRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_mts_cofinsamount",
                  value: 0,
                  ignoreFieldChange: true
               });
               currentRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_mts_lastcofinsamount",
                  value: 0,
                  ignoreFieldChange: true
               });
               currentRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_mts_pisbasis",
                  value: 0,
                  ignoreFieldChange: true
               });
               currentRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_mts_pisamount",
                  value: 0,
                  ignoreFieldChange: true
               });
               currentRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_mts_lastpisamount",
                  value: 0,
                  ignoreFieldChange: true
               });

               salespurchfunctions.onFC_Item_Quantity(scriptContext);
            } else if (currentField == "rate") {
               // console.log("rate")

               var sourceField = currentRec.getCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_mts_sourcefield"
               });

               if (sourceField != 'custcol_mts_pisamount' && sourceField != 'custcol_mts_cofinsamount') {
                  var brUnitPrice = currentRec.getCurrentSublistValue({
                     fieldId: 'custcol_mts_brunitprice',
                     sublistId: 'item'
                  });
                  console.log(brUnitPrice)

                  if (brUnitPrice) {
                     currentRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_lastcofinsamount",
                        value: 0
                     });

                     salespurchfunctions.calculateRateByCofinsAmount(currentRec);

                     currentRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_lastpisamount",
                        value: 0
                     });

                     salespurchfunctions.calculateRateByPisAmount(currentRec);
                  }
               }

               salespurchfunctions.onFC_Item_Rate(scriptContext);
            } else if (currentField == "custcol_mts_brunitprice") {
               // console.log("custcol_mts_brunitprice")

               salespurchfunctions.onFC_Item_BRUnitPrice(scriptContext);
            } else if (currentField == "item") {
               // console.log("item")

               haveItemFieldChanged = true;
               salespurchfunctions.onFC_Item_Item(scriptContext);
            } else if (currentField == "custcol_mts_injectedenergy") {
               salespurchfunctions.onFC_Main_InjectedEnergy(scriptContext)
            } else if (currentField == "custcol_mts_otherdeductions") {
               salespurchfunctions.onFC_Main_OtherDeductions(scriptContext)
            }

            salespurchfunctions.updateGenerateTaxes(currentRec, currentField);
         } else if (currentSublist == 'recmachcustrecord_mts_transaction_doccharges') {
            if (currentField == "custrecord_mts_itemchargecode_doccharges") {
               salespurchfunctions.onFC_DocCharges_ItemChargeCode(scriptContext);
            }
         } else if (currentSublist == "recmachcustrecord_mts_transaction_addinvlt") {
            if (currentField == "custrecord_mts_copydefaulttext_addinvlt") {
               salespurchfunctions.onFC_AddInvText_CopyDefText(scriptContext);
            }
         }

         if (currentField == "entity") {
            if (currentRec.getValue({ fieldId: "entity" })) {
               salespurchfunctions.setTerritoryInTransaction(currentRec, currentRec.getValue({ fieldId: "entity" }));
               salespurchfunctions.updateTextContrAdditionalINV(currentRec, currentRec.getValue({ fieldId: "entity" }))
            } else {
               salespurchfunctions.removeTextContrAdditionalINV(currentRec);

               currentRec.setValue({
                  fieldId: "custbody_mts_territorycode",
                  value: ""
               });
            }
         } else if (currentField == "custbody_mts_rpa") {
            fieldChangedLabel = currentRec.getField({ fieldId: "custbody_mts_rpa" }).label;
            salespurchfunctions.askUpdatePurchLines(currentRec, fieldChangedLabel, "custbody_mts_rpa");
         } else if (currentField == "custbody_mts_branchcode") {
            currentRec.setValue({
               fieldId: "custbody_mts_cnaeemitent",
               value: "",
               ignoreFieldChange: true
            });
            fieldChangedLabel = currentRec.getField({ fieldId: "custbody_mts_branchcode" }).label;
            salespurchfunctions.askUpdateSalesLines(currentRec, fieldChangedLabel, "custbody_mts_branchcode");
         } else if (currentField == "trandate") {
            salespurchfunctions.onFC_Main_TranDate(scriptContext, ObjHeader);
         } else if (currentField == "custbody_mts_taxareacode") {
            var fieldChangedLabel = currentRec.getField({ fieldId: "custbody_mts_taxareacode" }).label;
            salespurchfunctions.askUpdateSalesLines(currentRec, fieldChangedLabel, "custbody_mts_taxareacode");
         } else if (currentField == "custbody_mts_complementaryinvoicetype") {
            salespurchfunctions.onFC_Main_ComplementaryInvoiceType(scriptContext, ObjHeader);
         } else if (currentField == "custbody_mts_fiscaldocumentype") {
            salespurchfunctions.onFC_Main_FiscalDocumentType(scriptContext, ObjHeader, FiscalDocTypeObj);
         } else if (currentField == "custbody_mts_operationtype") {
            salespurchfunctions.onFC_Main_OperationType(scriptContext, ObjHeader, OperationTypeObj);
         } else if (currentField == "custbody_mts_invoicetocomplement") {
            salespurchfunctions.onFC_Main_InvoiceToComplement(scriptContext);
         } else if (currentField == "terms") {
            salespurchfunctions.updateGenerateTaxes(currentRec, currentField);
         } else if (currentField == "custbody_mts_shippingagentno") {
            salespurchfunctions.onFC_Main_ShippingAgentNo(scriptContext);
         }
      }

      function postSourcing(scriptContext) {
         var currentRecord = scriptContext.currentRecord;
         var currentField = scriptContext.fieldId;
         var currentSublist = scriptContext.sublistId;

         if (currentSublist == "item") {
            if (currentField == "item" && haveItemFieldChanged) {
               salespurchfunctions.onPS_Item_Item(scriptContext, ItemObj, OperationTypeObj, EntityRec);
               haveItemFieldChanged = false;
            }
         } else if (currentField == "subsidiary") {
            salespurchfunctions.onPS_Main_Subsidiary(scriptContext);
         } else if (currentField == "billaddresslist") {
            salespurchfunctions.onPS_Main_BillAddressList(scriptContext);
         }
      }

      function lineInit(scriptContext) {

      }

      function validateDelete(scriptContext) {
         var currentRecord = scriptContext.currentRecord;
         var currentSublist = scriptContext.sublistId;
         var validateReturn = true;

         try {
            if (currentSublist == "item") {
               validateReturn = salespurchfunctions.onVD_Item(scriptContext);
            }
         } catch (ex) {
            alert(ex.message);
            console.error(ex);
            return false;
         }

         return validateReturn;
      }

      function validateInsert(scriptContext) {
         return true;
      }

      function validateLine(scriptContext) {
         var currencRec = scriptContext.currentRecord;
         var currentSublist = scriptContext.sublistId;
         var validateReturn = true;

         try {
            if (currentSublist == "item") {
               validateReturn = salespurchfunctions.onVL_Item(scriptContext);
            } else if (currentSublist == "installment") {
               validateReturn = salespurchfunctions.onVL_Installment(scriptContext);
            }
         } catch (ex) {
            alert(ex.message);
            console.error(ex);
            return false;
         }

         return validateReturn;
      }

      function sublistChanged(scriptContext) {
      }

      function assigDocumentCharges() {

         try {

            var curRec = currentrec.get();
            var objParameters = {};
            objParameters.transactionType = curRec.type;
            objParameters.transactionId = curRec.id;

            record.submitFields({
               type: curRec.type,
               id: curRec.id,
               values: {
                  'custbody_mts_complementarytaskname': assignDocChargesLabel(),
                  'custbody_mts_complementarytaskstatus': 2,
                  'custbody_mts_complementarytaskerrorobj': ''
               },
               options: {
                  enableSourcing: false,
                  ignoreMandatoryFields: true,
                  disableTriggers: true
               }
            });

            https.post({
               url: url.resolveScript({
                  scriptId: 'customscript_mts_rl_assigndocumentcharge',
                  deploymentId: 'customdeploy_mts_rl_assigndocchargedp'
               }),
               body: JSON.stringify(objParameters)
            });

            window.location.reload();

         } catch (error) {
            alert(error);
         }
      }

      function assigDocumentChargesOnEdit() {
         try {
            var transactionRec = currentrec.get();

            var response = assigndoccharges.run(transactionRec);
            if (!response) {
               message
                  .create({
                     title: "CONFIRMATION",
                     message: salespurchmessages.getText00040(),
                     type: message.Type.CONFIRMATION
                  })
                  .show({ duration: 10000 });
            } else if (response.name == "ERROR") {
               message
                  .create({
                     title: "ERROR",
                     message: response.message,
                     type: message.Type.ERROR
                  })
                  .show({ duration: 20000 });
            } else if (response.name == "WARNING") {
               message
                  .create({
                     title: "WARNING",
                     message: response.message,
                     type: message.Type.WARNING
                  })
                  .show({ duration: 20000 });
            } else if (response.name == "TypeError") {
               message
                  .create({
                     title: "ERROR",
                     message: response.message,
                     type: message.Type.ERROR
                  })
                  .show({ duration: 20000 });
            }

         } catch (err) {
            message.create({
               title: "ERROR",
               message: err.message,
               type: message.Type.ERROR
            }).show({ duration: 20000 });
            console.error(err);
         }
      }

      function generateTaxesInServer() {

         try {

            var curRec = currentrec.get();
            var objParameters = {};
            objParameters.transactionType = curRec.type;
            objParameters.transactionId = curRec.id;

            var transactionLookUp = search.lookupFields({
               type: curRec.type,
               id: curRec.id,
               columns: [
                  'custbody_mts_taxcalculationid'
               ]
            });

            var confirm = true;

            if (transactionLookUp.custbody_mts_taxcalculationid) {

               var lang = runtime.getCurrentUser().getPreference('LANGUAGE');

               var question = 'Do you want to recalculate taxes?';
               if (lang == 'pt_BR') {
                  question = 'Deseja recalcular os impostos?';
               } else if (lang == 'es_ES') {
                  question = '¿Quieres recalcular los impuestos?';
               }

               confirm = window.confirm(question);
            }

            if (confirm) {

               record.submitFields({
                  type: curRec.type,
                  id: curRec.id,
                  values: {
                     'custbody_mts_complementarytaskname': generateTaxesLabel(),
                     'custbody_mts_complementarytaskstatus': 2,
                     'custbody_mts_complementarytaskerrorobj': ''
                  },
                  options: {
                     enableSourcing: false,
                     ignoreMandatoryFields: true,
                     disableTriggers: true
                  }
               });

               https.post({
                  url: url.resolveScript({
                     scriptId: 'customscript_mts_rl_taxcalctask',
                     deploymentId: 'customdeploy_mts_rl_taxcalctaskdp'
                  }),
                  body: JSON.stringify(objParameters)
               });

               window.location.reload();

            }

         } catch (error) {
            alert(error);
         }

      }

      function generateTaxesInServerOnEdit() {
         try {
            var currRec = currentrec.get();

            var dateBefore = new Date().toLocaleString();
            console.log("Create TranObj - BEFORE: " + dateBefore);

            var tranToCalcObj = salespurchfunctions.createTranToCalcObj(currRec);
            var respLines = salespurchfunctions.validateBrUnitPrice(tranToCalcObj);
            if (!respLines) {
               return;
            }
            var dateAfter = new Date().toLocaleString();
            console.log("Create TranObj - AFTER: " + dateAfter);
            console.log(tranToCalcObj);

            var dateBefore = new Date().toLocaleString();
            console.log("Call Restlet - BEFORE: " + dateBefore);

            var output = url.resolveScript({
               scriptId: "customscript_mts_restlet_taxcalculation",
               deploymentId: "customdeploy_mts_restlet_taxcalculation"
            });

            var resp = https.post({
               url: output,
               body: JSON.stringify(tranToCalcObj)
            });

            var taxObjCalculated = JSON.parse(resp.body);

            var dateAfter = new Date().toLocaleString();
            console.log("Call Restlet - AFTER: " + dateAfter);
            console.log(taxObjCalculated);

            var dateBefore = new Date().toLocaleString();
            console.log("Adjusts Tax Calculation - BEFORE: " + dateBefore);

            salespurchfunctions.updateLineItemAfterCalcTaxes(currRec, taxObjCalculated);
            salespurchfunctions.updateAddTextsFromBusAutoAfterCalcTaxes(currRec, taxObjCalculated);
            currRec.setValue({ fieldId: "custbody_mts_taxcalculationid", value: taxObjCalculated.headerLoc.id });
            currRec.setValue({ fieldId: 'custbody_mts_taxcalculationstatus', value: 1 });

            var dateAfter = new Date().toLocaleString();
            console.log("Adjusts Tax Calculation - AFTER: " + dateAfter);

            var myMsg = message.create({
               message: "Taxes has been calculated successfully!",
               type: message.Type.INFORMATION
            });
            myMsg.show({ duration: 10000 });
         } catch (err) {
            message.create({
               title: "ERROR",
               message: err.message,
               type: message.Type.ERROR
            }).show({ duration: 20000 });
            console.error(err);
         }
      }

      function viewTaxes(sourceViewType) {
         if (sourceViewType == "view") {
            var currentRecord = currentrec.get();
            var tranRecLoad = record.load({
               type: currentRecord.type,
               id: currentRecord.id
            });
         } else {
            var tranRecLoad = currentrec.get();
         }

         var entity = tranRecLoad.getValue({ fieldId: "entity" });
         var subsidiary = tranRecLoad.getValue({ fieldId: "subsidiary" });
         var branchCode = tranRecLoad.getValue({ fieldId: "custbody_mts_branchcode" });
         var taxesCalculationId = tranRecLoad.getValue({ fieldId: "custbody_mts_taxcalculationid" });
         var category = tranRecLoad.getValue({ fieldId: "custbody_mts_nfce_customer_cat" });

         var hasBilladdress = tranRecLoad.hasSubrecord({ fieldId: 'billingaddress' }); //  LocBr20.03

         if (hasBilladdress) {
            var billaddress = tranRecLoad.getSubrecord('billingaddress');

            var state = billaddress.getValue('state')
            var country = billaddress.getValue('country')
         }
         else {
            var state = tranRecLoad.getValue({ fieldId: "custbody_mts_territorycode" }).substr(0, 2);
            var country = tranRecLoad.getText({ fieldId: "custbody_mts_country" }).substr(0, 2);
         }

         console.log(taxesCalculationId);

         if (!taxesCalculationId) {
            alert(salespurchmessages.getText00004());
            return;
         }

         var isEditMode = false;
         if (sourceViewType == 'edit' || sourceViewType == 'create' | sourceViewType == 'copy')
            isEditMode = true;

         var output = url.resolveRecord({
            recordType: "customrecord_mts_headerlocvat",
            recordId: taxesCalculationId,
            params: {
               entity: entity,
               subsidiary: subsidiary,
               branch: branchCode,
               isEditMode: isEditMode,
               state: state,
               country: country,
               category: category
            },
            isEditMode: isEditMode
         });

         console.log(output);
         window.open(output);
      }

      function assignDocChargesLabel() {
         var lang = runtime.getCurrentUser().getPreference('LANGUAGE');
         var text = 'Assign Document Charges';

         if (lang == 'pt_BR') {
            text = 'Distribuir Encargos do Documento';
         } else if (lang.match('es-*')) {
            text = 'Asignar Encargos del Documento';
         }
         return text;
      }

      function generateTaxesLabel() {
         var lang = runtime.getCurrentUser().getPreference('LANGUAGE');
         var text = 'Generate Taxes';

         if (lang == 'pt_BR') {
            text = 'Gerar Impostos';
         } else if (lang.match('es-*')) {
            text = 'Generar Impuestos';
         }
         return text;
      }

      function updateSublistItens() {
         var currentRecord = currentrec.get();
         var taxArea = currentRecord.getValue('custbody_mts_taxareacode');
         var grContabilNegocio = currentRecord.getValue('custbody_mts_genbuspostinggroup');
         var getLineCount = currentRecord.getLineCount({ sublistId: 'item' });

         for (var line = 0; line < getLineCount; line++) {

            var brUnitPrice = currentRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_mts_brunitprice", line: line });

            if (brUnitPrice == 0) {
               var itemRecordType = '';

               var itemId = currentRecord.getSublistValue({
                  sublistId: "item",
                  fieldId: "item",
                  line: line
               });

               var itemType = currentRecord.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'itemtype',
                  line: line
               });

               currentRecord.selectLine({ sublistId: 'item', line: line });

               switch (itemType) {

                  case "InvtPart":
                     itemRecordType = search.Type.INVENTORY_ITEM

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_allowitemchargeass",
                        value: true,
                        ignoreFieldChange: true
                     });

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 2,
                        ignoreFieldChange: true
                     });

                     break;
                  case "NonInvtPart":
                     itemRecordType = search.Type.NON_INVENTORY_ITEM;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_allowitemchargeass",
                        value: true,
                        ignoreFieldChange: true
                     });

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 7,
                        ignoreFieldChange: true
                     });

                     break;
                  case "OthCharge":
                     itemRecordType = search.Type.OTHER_CHARGE_ITEM;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 4,
                        ignoreFieldChange: true
                     });

                     break;
                  case "Service":
                     itemRecordType = search.Type.SERVICE_ITEM;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 1,
                        ignoreFieldChange: true
                     });

                     break;
                  case "Assembly":
                     itemRecordType = search.Type.ASSEMBLY_ITEM;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 8,
                        ignoreFieldChange: true
                     });

                     break;
                  case "Discount":
                     itemRecordType = search.Type.DISCOUNT_ITEM;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 10,
                        ignoreFieldChange: true
                     });

                     break;
                  case "Description":
                     itemRecordType = search.Type.DESCRIPTION_ITEM;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 9,
                        ignoreFieldChange: true
                     });

                     break;
                  case "Expense":
                     itemRecordType = search.Type.EXPENSE;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 11,
                        ignoreFieldChange: true
                     });

                     break;
                  case "Group":
                     itemRecordType = search.Type.ITEM_GROUP;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 12,
                        ignoreFieldChange: true
                     });

                     break;
                  case "Kit":
                     itemRecordType = search.Type.KIT_ITEM;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 13,
                        ignoreFieldChange: true
                     });

                     break;
                  case "GiftCert":
                     itemRecordType = search.Type.GIFT_CERTIFICATE_ITEM;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 16,
                        ignoreFieldChange: true
                     });

                     break;
                  case "Markup":
                     itemRecordType = search.Type.MARKUP_ITEM;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 14,
                        ignoreFieldChange: true
                     });

                     break;
                  case "Payment":
                     itemRecordType = search.Type.PAYMENT_ITEM;

                     currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mts_itemtype",
                        value: 15,
                        ignoreFieldChange: true
                     });

                     break;
               }

               var itemRecordLookup = search.lookupFields({
                  type: itemRecordType,
                  id: itemId,
                  columns: [
                     'location', 'purchaseunit', 'class', 'lastpurchaseprice'
                  ]
               });
               var locationItem = itemRecordLookup.location.length ? itemRecordLookup.location[0].value : currentRecord.getValue('location');
               var unit = itemRecordLookup.purchaseunit.length ? itemRecordLookup.purchaseunit[0].value : '';
               var costCenter = itemRecordLookup.class.length ? itemRecordLookup.class[0].value : '';
               var lasPricing = itemRecordLookup.lastpurchaseprice

               currentRecord.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'location',
                  value: locationItem,
                  ignoreFieldChange: true
               });

               currentRecord.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'units',
                  value: unit,
                  ignoreFieldChange: true
               });

               currentRecord.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'class',
                  value: costCenter,
                  ignoreFieldChange: true
               });
               currentRecord.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_mts_taxareacode',
                  value: taxArea,
                  ignoreFieldChange: true
               });
               currentRecord.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_mts_genbuspostinggroup',
                  value: grContabilNegocio,
                  ignoreFieldChange: true
               });

               currentRecord.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_mts_brunitprice',
                  value: lasPricing,
                  ignoreFieldChange: true
               });

               var quantity = currentRecord.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'quantity',
                  line: line
               });

               var brLineDiscPerc = currentRecord.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_mts_brlinediscountpercent',
                  line: line
               });

               var brGrossAmount = parseFloat(lasPricing * quantity);
               var brGrossAmountDiscounted = 0;
               if (brLineDiscPerc) {
                  brGrossAmountDiscounted = parseFloat((brGrossAmount - (brGrossAmount * (brLineDiscPerc / 100)).toFixed(2)));
               }

               currentRecord.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_mts_brgrossamount',
                  value: brGrossAmount,
               });
               currentRecord.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_mts_brgrossamountdiscounted',
                  value: brGrossAmountDiscounted,
               });

               currentRecord.commitLine({ sublistId: 'item' });

               taxCalculateItemRate(currentRecord, line);
            }
         }
      }

      function taxCalculateItemRate(currentRecord, line) {
         var tranToCalcObj = {
            objHeader: {},
            objLine: {}
         };
         console.log('entro nessa parte')
         tranToCalcObj.objHeader.RecordType = currentRecord.type;
         tranToCalcObj.objHeader.RecordId = currentRecord.id;
         tranToCalcObj.objHeader.SourceType = 2;
         tranToCalcObj.objHeader.IsPurchase = false;
         tranToCalcObj.objHeader.AliqICMSSimples = 0;
         tranToCalcObj.objHeader.EndUser = currentRecord.getValue({ fieldId: 'custbody_mts_enduser' }) || false;
         tranToCalcObj.objHeader.BranchCode = {};
         tranToCalcObj.objHeader.BranchCode.Id = currentRecord.getValue({ fieldId: 'custbody_mts_branchcode' }) || '';
         tranToCalcObj.objHeader.TranDateNotFormated = currentRecord.getValue({ fieldId: 'trandate' });
         tranToCalcObj.objHeader.TranDateCurrDateFormat = DateFormatToString(tranToCalcObj.objHeader.TranDateNotFormated);

         tranToCalcObj.objLine.NCMCode = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_ncmcode', line: line }) || '';
         tranToCalcObj.objLine.TaxAreaCode = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_taxareacode', line: line }) || '';
         tranToCalcObj.objLine.TaxGroupCode = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_taxgroupcode', line: line }) || '';
         tranToCalcObj.objLine.ItemTaxSourceCode = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_itemtaxsourcecode', line: line }) || '';
         tranToCalcObj.objLine.UnitPrice = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: line }) || 0;
         tranToCalcObj.objLine.BrUnitPrice = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_brunitprice', line: line }) || 0;
         tranToCalcObj.objLine.lineNo = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_lineno', line: line }) || 0;
         tranToCalcObj.objLine.BrLineDiscountPerc = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mts_brlinediscountpercent', line: line }) || 0;

         var objTaxCalculated = taxcalculate.CalculateNetUnitPrice(tranToCalcObj);
         tranToCalcObj.objLine.UnitPriceCalculated = objTaxCalculated.UnitPrice;

         currentRecord.selectLine({ sublistId: 'item', line: line });
         currentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: tranToCalcObj.objLine.UnitPriceCalculated,
            line: line
         });

         currentRecord.commitLine({ sublistId: 'item' });
      }

      function DateFormatToString(myDate) {
         var DateFormated = format.format({
            value: myDate,
            type: format.Type.DATE
         });
         return DateFormated;
      }

      return {
         pageInit: pageInit,
         saveRecord: saveRecord,
         validateField: validateField,
         fieldChanged: fieldChanged,
         postSourcing: postSourcing,
         lineInit: lineInit,
         validateDelete: validateDelete,
         validateInsert: validateInsert,
         validateLine: validateLine,
         sublistChanged: sublistChanged,
         assigDocumentCharges: assigDocumentCharges,
         assigDocumentChargesOnEdit: assigDocumentChargesOnEdit,
         generateTaxesInServer: generateTaxesInServer,
         generateTaxesInServerOnEdit: generateTaxesInServerOnEdit,
         viewTaxes: viewTaxes,
         updateSublistItens: updateSublistItens
      }
   }
);