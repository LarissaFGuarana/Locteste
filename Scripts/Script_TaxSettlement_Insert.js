/**
 *@NApiVersion 2.x
 */
/*
yyyy.mm.dd	Developer	Ref/Task	Version			Description
------------------------------------------------------------------------------------------------------------------------------------
2021.11.17  LF        	4288		LocBr21.01		Adjust new obj  C500 region
*/
define(
   [
      'N/record',
      'N/file',
      './Util/getFolderId.js'
   ],

   function (
      record,
      file,
      getFolderId
   ) {

      function initCfopAbstract(arrDetailLocVatEntry, objGlobalVars, arrCFOPAbstract) {
         try {

            var idx = -1;

            for (var i = 0; i < arrCFOPAbstract.length; i++) {

               if (arrCFOPAbstract[i].CFOPCode == arrDetailLocVatEntry.CFOPCode &&
                  arrCFOPAbstract[i].taxSettlementCode == arrDetailLocVatEntry.idTaxSettlement) {

                  idx = i;
               };

            }

            log.debug({
               title: 'Result indexOf',
               details: idx
            });

            var objCFOPAbstract = {}

            if (!arrDetailLocVatEntry.transfICMSAmount) {

               if (idx == -1) {

                  objCFOPAbstract.CFOPCode = arrDetailLocVatEntry.CFOPCode
                  objCFOPAbstract.cfopDescription = arrDetailLocVatEntry.operationDescription
                  objCFOPAbstract.taxSettlementCode = arrDetailLocVatEntry.idTaxSettlement

                  if (arrDetailLocVatEntry.complinvtype != 5) { //"Complementary ICMS DIF ST"
                     objCFOPAbstract.glAmount = arrDetailLocVatEntry.grossAmount + objGlobalVars.chargeGLAmount
                  }

                  if (arrDetailLocVatEntry.complinvtype != 5 && arrDetailLocVatEntry.complinvtype != 1) { //"Complementary ICMS DIF ST" AND "Complementary Invoice Type"::"Complementary IPI Inv."
                     objCFOPAbstract.glAmountICMSStatement = arrDetailLocVatEntry.grossAmount + objGlobalVars.chargeGLAmount
                  }

                  if (arrDetailLocVatEntry.complinvtype == 5) { //"Complementary ICMS DIF ST"
                     objCFOPAbstract.glAmount = arrDetailLocVatEntry.grossAmount
                  }

                  if (arrDetailLocVatEntry.taxidentificati == 2) { //ICMS

                     var objGetAmounts = getAmounts(arrDetailLocVatEntry, objGlobalVars);

                     objCFOPAbstract.ICMSExemptAmount = objGetAmounts.exemptAmount;
                     objCFOPAbstract.ICMSAmount = objGetAmounts.amount;
                     objCFOPAbstract.ICMSBasisAmount = objGetAmounts.basisAmount;
                     objCFOPAbstract.ICMSOthersAmount = objGetAmounts.othersAmount;
                  }

                  if (arrDetailLocVatEntry.taxidentificati == 1) { //IPI

                     var objGetAmounts = getAmounts(arrDetailLocVatEntry, objGlobalVars);

                     objCFOPAbstract.IPIExemptAmount = objGetAmounts.exemptAmount;
                     objCFOPAbstract.IPIAmount = objGetAmounts.amount;
                     objCFOPAbstract.IPIBasisAmount = objGetAmounts.basisAmount;
                     objCFOPAbstract.IPIOthersAmount = objGetAmounts.othersAmount;
                  }

                  if (arrDetailLocVatEntry.taxidentificati == 15) { //ST

                     objCFOPAbstract.BaseICMSST = arrDetailLocVatEntry.base;
                     objCFOPAbstract.ICMSST = arrDetailLocVatEntry.amount;
                     objCFOPAbstract.ICMSExemptAmountST = arrDetailLocVatEntry.exemptBasisAmount;
                     objCFOPAbstract.ICMSOthersAmountST = arrDetailLocVatEntry.othersBasisAmount;
                     objCFOPAbstract.AmountICMSforST = 1;

                  }

                  log.debug({
                     title: 'Adicionar Linha',
                     details: JSON.stringify(objCFOPAbstract)
                  });

                  arrCFOPAbstract.push(objCFOPAbstract);

               } else {

                  if (arrDetailLocVatEntry.taxidentificati == 2) { //ICMS

                     var objGetAmounts = getAmounts(arrDetailLocVatEntry, objGlobalVars);

                     arrCFOPAbstract[idx].ICMSExemptAmount += objGetAmounts.exemptAmount;
                     arrCFOPAbstract[idx].ICMSAmount += objGetAmounts.amount;
                     arrCFOPAbstract[idx].ICMSBasisAmount += objGetAmounts.basisAmount;
                     arrCFOPAbstract[idx].ICMSOthersAmount += objGetAmounts.othersAmount;

                  }

                  if (arrDetailLocVatEntry.taxidentificati == 1) { //IPI

                     var objGetAmounts = getAmounts(arrDetailLocVatEntry, objGlobalVars);

                     arrCFOPAbstract[idx].IPIExemptAmount += objGetAmounts.exemptAmount;
                     arrCFOPAbstract[idx].IPIAmount += objGetAmounts.amount;
                     arrCFOPAbstract[idx].IPIBasisAmount += objGetAmounts.basisAmount;
                     arrCFOPAbstract[idx].IPIOthersAmount += objGetAmounts.othersAmount;

                  }

                  if (arrDetailLocVatEntry.taxidentificati == 15) { //ST

                     arrCFOPAbstract[idx].BaseICMSST += arrDetailLocVatEntry.base;
                     arrCFOPAbstract[idx].ICMSST += arrDetailLocVatEntry.amount;
                     arrCFOPAbstract[idx].ICMSExemptAmountST += arrDetailLocVatEntry.exemptBasisAmount;
                     arrCFOPAbstract[idx].ICMSOthersAmountST += arrDetailLocVatEntry.othersBasisAmount;
                     arrCFOPAbstract[idx].AmountICMSforST += 1;

                  }

                  log.debug({
                     title: 'Sumarizar - Linha',
                     details: JSON.stringify(arrCFOPAbstract[idx])
                  });
               }

            } else {

               objCFOPAbstract.CFOPCode = arrDetailLocVatEntry.CFOPCode
               objCFOPAbstract.cfopDescription = arrDetailLocVatEntry.operationDescription
               objCFOPAbstract.taxSettlementCode = arrDetailLocVatEntry.idTaxSettlement

               if (arrDetailLocVatEntry.complinvtype != 5) { //"Complementary ICMS DIF ST"
                  objCFOPAbstract.glAmount = 0;

                  arrCFOPAbstract.push(objCFOPAbstract);
               }
            }

         }
         catch (ex) {
            log.error({
               title: 'Error function initCfopAbstract',
               details: ex.message
            });
            throw new Error();
         }
      }

      function initStateAbstract(arrDetailLocVatEntry, objGlobalVars, arrStateAbstract) {
         try {

            var ind = -1;

            for (var i = 0; i < arrStateAbstract.length; i++) {
               if (arrStateAbstract[i].CFOPCode == arrDetailLocVatEntry.CFOPCode &&
                  arrStateAbstract[i].taxSettlementCode == arrDetailLocVatEntry.idTaxSettlement
                  && arrStateAbstract[i].territoryCode == arrDetailLocVatEntry.territoryCode
               ) {

                  ind = i;
               }
            }

            var objStateAbstract = {};


            if (ind == -1) {

               objStateAbstract.CFOPCode = arrDetailLocVatEntry.CFOPCode;
               objStateAbstract.cfopDescription = arrDetailLocVatEntry.operationDescription;
               objStateAbstract.territoryCode = arrDetailLocVatEntry.territoryCode;


               if (arrDetailLocVatEntry.complinvtype != 2) {//Complementary Invoice Type != "Complementary ICMS Inv."
                  objStateAbstract.glAmount = arrDetailLocVatEntry.grossAmount + objGlobalVars.chargeGLAmount;
               }


               if (arrDetailLocVatEntry.territoryCode) {
                  // objStateAbstract.giaTerritoryCode = scriptSearch.territoryCodeGIA(arrDetailLocVatEntry.territoryCode);
               }

               if (arrDetailLocVatEntry.complinvtype == 2) {//Complementary ICMS Inv.
                  objStateAbstract.glAmount = 0;
               }

               if (arrDetailLocVatEntry.complinvtype == 5) {// Complementary ICMS DIF ST
                  objStateAbstract.glAmount = arrDetailLocVatEntry.grossAmount;
               }

               var cfop1stDig = arrDetailLocVatEntry.CFOPCode.substr(0, 1);
               objStateAbstract.cfop1stDig == cfop1stDig;

               objStateAbstract.taxSettlementCode = arrDetailLocVatEntry.idTaxSettlement;
               objStateAbstract.userId = arrDetailLocVatEntry.userId;


               if (arrDetailLocVatEntry.taxidentificati == 2) {// ICMS
                  //var objGetAmounts = scriptInsert.getAmounts(arrDetailLocVatEntry, objGlobalVars);

                  objStateAbstract.ICMSExemptAmount = 0;
                  objStateAbstract.ICMSAmount = 0;
                  objStateAbstract.ICMSBasisAmount = 0;
                  objStateAbstract.ICMSOthersAmount = 0;

                  if (arrDetailLocVatEntry.ie != "" && arrDetailLocVatEntry.ie != "ISENTO") {
                     objStateAbstract.ICMSAmountNoContributor += 0 //objGetAmounts.amount;
                     objStateAbstract.ICMSBasisAmountNoContr += 0 //objGetAmounts.basisAmount;
                  }
               }

               if (arrDetailLocVatEntry.taxidentificati == 1) { // IPI
                  //var objGetAmounts = scriptInsert.getAmounts(arrDetailLocVatEntry, objGlobalVars);

                  objStateAbstract.IPIBasisAmount = 0 //objGetAmounts.basisAmount;
                  objStateAbstract.IPIExemptAmount = 0  //objGetAmounts.exemptAmount;
                  objStateAbstract.IPIAmount = 0 //objGetAmounts.amount;
                  objStateAbstract.IPIOthersAmount = 0 //objGetAmounts.othersAmount;
               }

               if (arrDetailLocVatEntry.taxidentificati == 15) {// ST
                  //var objGetAmounts = scriptInsert.getAmounts(arrDetailLocVatEntry, objGlobalVars);

                  objStateAbstract.BaseICMSST = objGetAmounts.baseAmount;
                  objStateAbstract.ICMSST = objGetAmounts.amount;
               }

               /* if(arrDetailLocVatEntry.taxidentificati == 3 ){// PIS
             percentAbstract.PisAmount = amount + chargeAmount;
           }

           if(arrDetailLocVatEntry.taxidentificati == 4 ){// COFINS
              percentAbstract.CofinsAmount = amount + chargeAmount;
           } */

               arrStateAbstract.push(objStateAbstract);

               log.debug({
                  title: ' arrStateAbstract.push(objStateAbstract)',
                  details: objStateAbstract
               });

            } else

               if (arrDetailLocVatEntry.complinvtype != 2) {// != Complementary ICMS Inv.


                  if (arrDetailLocVatEntry.taxidentificati == 2) {// ICMS

                     //var objGetAmounts = scriptInsert.getAmounts(arrDetailLocVatEntry, objGlobalVars);

                     arrStateAbstract[ind].ICMSExemptAmount = 0 //objGetAmounts.exempAmount;
                     arrStateAbstract[ind].ICMSAmount = 0 //objGetAmounts.amount;
                     arrStateAbstract[ind].ICMSBasisAmount = 0 //objGetAmounts.basisAmount;
                     arrStateAbstract[ind].ICMSOthersAmount = 0 //objGetAmounts.othersAmount;

                     if (!arrDetailLocVatEntry.ie != "" && !arrDetailLocVatEntry.ie != "ISENTO") {

                        arrStateAbstract[ind].ICMSAmountNoContributor += 0 //objGetAmounts.amount;
                        arrStateAbstract[ind].ICMSBasisAmountNoContr += 0 //objGetAmounts.basisAmount;
                     }
                  }

                  if (arrDetailLocVatEntry.taxidentificati == 1) {// IPI

                     //var objGetAmounts = scriptInsert.getAmounts(arrDetailLocVatEntry, objGlobalVars);

                     arrStateAbstract[ind].IPIBasisAmount += 1 //objGetAmounts.basisAmount;
                     arrStateAbstract[ind].IPIExemptAmount += 1 //objGetAmounts.exempAmount;
                     arrStateAbstract[ind].IPIAmount += 1 //objGetAmounts.amount;
                     arrStateAbstract[ind].IPIOthersAmount += 1 //objGetAmounts.othersAmount;
                  }

                  if (arrDetailLocVatEntry.taxidentificati == 15) {// ST

                     arrStateAbstract[ind].BaseICMSST = arrDetailLocVatEntry.base;
                     arrStateAbstract[ind].ICMSST = arrDetailLocVatEntry.amount;
                  }

                  /* if(arrDetailLocVatEntry.taxidentificati == 3 ){// PIS

                  percentAbstract.PISAmount += amount + chargeAmount;
                }

                if(arrDetailLocVatEntry.taxidentificati == 4 ){// COFINS

                  percentAbstract.COFINSAmount += amount + chargeAmount;

                } */

               }
         } catch (ex) {
            log.error({
               title: "Error function InitStateAbstracts",
               details: ex.message
            });
            throw new Error();
         }
      }

      function initParticipantReg(arrDetailLocVatEntry) {

         var indexPart = -1;

         for (var int = 0; int < arrParticipantReg.length; int++) {
            if (arrParticipantReg[int].taxSettlementCode == arrDetailLocVatEntry.taxSettlementCode &&
               arrParticipantReg[int].userId == arrDetailLocVatEntry.userId &&
               arrParticipantReg[int].billToPayToNo == arrDetailLocVatEntry.billToPayToNo &&
               arrParticipantReg[int].branchCode == arrDetailLocVatEntry.branchCode) {

               indexPart = int;
            }
         }

         var objParticipantReg = {};

         if (indexPart == -1) {

            objParticipantReg.taxSettlementCode = arrDetailLocVatEntry.taxSettlementCode;
            objParticipantReg.userId = arrDetailLocVatEntry.userId;
            objParticipantReg.billToPayToNo = arrDetailLocVatEntry.billToPayToNo;
            objParticipantReg.branchCode = arrDetailLocVatEntry.branchCode;


            if (arrDetailLocVatEntry.sourceType == 2) {// Sale
               var customerRecord = record.load({ type: 'customer', id: arrDetailLocVatEntry.billToPayToNo });

               // Entity Address
               var entityaddress = customerRecord.getSublistSubrecord({
                  sublistId: 'addressbook',
                  fieldId: 'addressbookaddress',
                  line: 0
               });

               if (entityaddress) {
                  var address1 = entityaddress.getValue({ fieldId: 'addr1' });
                  var address2 = entityaddress.getValue({ fieldId: 'addr2' });
                  objParticipantReg.address = (address1 + " " + address2);

                  objParticipantReg.country = entityaddress.getValue({ fieldId: 'country' });
                  objParticipantReg.zipCode = entityaddress.getValue({ fieldId: 'zip' }).replace(/-/g, '');
                  objParticipantReg.district = entityaddress.getValue({ fieldId: 'custrecord_mtsdistrict' });
                  objParticipantReg.IBGECityCode = entityaddress.getValue({ fieldId: 'custrecord_mts_ibgecitycode' });
                  objParticipantReg.number = entityaddress.getValue({ fieldId: 'custrecord_mts_number' });
                  objParticipantReg.district = entityaddress.getValue({ fieldId: 'custrecord_mtsdistrict' });
                  objParticipantReg.zipCode = entityaddress.getValue({ fieldId: 'zip' }).replace(/-/g, '');
               }


               if (customerRecord.getValue({ fieldId: 'entityid' }) /* || country / RegionCode */) {
                  objParticipantReg.description = customerRecord.getValue({ fieldId: 'entityid' });
                  objParticipantReg.countryCode = customerRecord.getValue({ fieldId: '' });

                  //var address = customerRecord.getValue({fieldId: 'defaultaddress'});
                  //objParticipantReg.address = address.substring(0,60);
                  // cometários sobre a regra de exibição dos campos address 1 e addrres 2


               }

               if (customerRecord.getValue({ fieldId: 'custentity_mts_categoryloc' }) == '1-Person') {// CATEGORY
                  var cnpj_cpf = customerRecord.getValue({ fieldId: 'custentity_mts_cnpjcpf' });
                  objParticipantReg.cpf = cnpj_cpf.replace(/[^0-9]/g, '');
               }

               if (customerRecord.getValue({ fieldId: 'custentity_mts_categoryloc' }) == '2-Company') {// CATEGORY
                  var cnpj_cpf = customerRecord.getValue({ fieldId: 'custentity_mts_cnpjcpf' });
                  objParticipantReg.cnpj = cnpj_cpf.replace(/[^0-9]/g, '');
               }

               var ie = customerRecord.getValue({ fieldId: 'custentity_mts_ie' });// IE
               if (ie.toUpperCase() == 'ISENTO') {
                  objParticipantReg.ie = '';
               } else {
                  objParticipantReg.ie = ie;
               }

            } else

               if (arrDetailLocVatEntry.sourceType == 1) {// PURCHASE

                  var vendorRecord = record.load({ type: 'vendor', id: arrDetailLocVatEntry.billToPayToNo });

                  // Entity Address
                  var entityaddress = vendorRecord.getSublistSubrecord({
                     sublistId: 'addressbook',
                     fieldId: 'addressbookaddress',
                     line: 0
                  });

                  if (entityaddress) {
                     var address1 = entityaddress.getValue({ fieldId: 'addr1' });
                     var address2 = entityaddress.getValue({ fieldId: 'addr2' });
                     objParticipantReg.address = (address1 + " " + address2);

                     objParticipantReg.country = entityaddress.getValue({ fieldId: 'country' });
                     objParticipantReg.zipCode = entityaddress.getValue({ fieldId: 'zip' }).replace(/-/g, '');
                     objParticipantReg.district = entityaddress.getValue({ fieldId: 'custrecord_mtsdistrict' });
                     objParticipantReg.IBGECityCode = entityaddress.getValue({ fieldId: 'custrecord_mts_ibgecitycode' });
                     objParticipantReg.number = entityaddress.getValue({ fieldId: 'custrecord_mts_number' });
                     objParticipantReg.district = entityaddress.getValue({ fieldId: 'custrecord_mtsdistrict' });
                     objParticipantReg.zipCode = entityaddress.getValue({ fieldId: 'zip' }).replace(/-/g, '');
                  }


                  objParticipantReg.description = vendorRecord.getValue({ fieldId: 'companyname' });

                  //var address = vendorRecord.getValue({fieldId:'defaultaddress'});
                  //objParticipantReg.address = address.substring(0,60);


                  if (vendorRecord.getValue({ fieldId: 'custentity_mts_categoryloc' }) == '1-Person') {
                     var cpf = vendorRecord.getValue({ fieldId: 'custentity_mts_cnpjcpf' });
                     objParticipantReg.cpf = cpf.replace(/[^0-9]/g, '');
                  }

                  if (vendorRecord.getValue({ fieldId: 'custentity_mts_categoryloc' }) == '2-Company') {
                     var cnpj = vendorRecord.getValue({ fieldId: 'custentity_mts_cnpjcpf' });
                     objParticipantReg.cnpj = cnpj.replace(/[^0-9]/g, '');
                  }

                  var ie = customerRecord.getValue({ fieldId: 'custentity_mts_ie' }); // IE
                  if (ie.toUpperCase() == 'ISENTO') {
                     objParticipantReg.ie = '';
                  } else {
                     objParticipantReg.ie = ie;
                  }
               }

            arrParticipantReg.push(objParticipantReg);
         }


         else {

            if (arrParticipantReg[int].sourceType == 1) {// PURCHASE

               arrParticipantReg[int].description = vendorRecord.getValue({ fieldId: 'companyname' });
               arrParticipantReg[int].countryCode =
                  arrParticipantReg[int].address = vendorRecord.getValue({ fieldId: 'defaultaddress' });

               if (vendorRecord.getValue({ fieldId: 'custentity_mts_categoryloc' }) == '1-Person') {
                  var cpf = vendorRecord.getValue({ fieldId: 'custentity_mts_cnpjcpf' });
                  arrParticipantReg[int].cpf = cpf.replace(/[^0-9]/g, '');
               }

               if (vendorRecord.getValue({ fieldId: 'custentity_mts_categoryloc' }) == '2-Company') {
                  var cnpj = vendorRecord.getValue({ fieldId: 'custentity_mts_cnpjcpf' });
                  arrParticipantReg[int].cnpj = cnpj.replace(/[^0-9]/g, '');
               }

               var ie = vendorRecord.getValue({ fieldId: 'custentity_mts_ie' });
               if (ie.toUpperCase() == 'ISENTO') {
                  arrParticipantReg[int].ie = '';
               } else {
                  arrParticipantReg[int].ie = ie;
               }

               // Entity Address
               var entityaddress = vendorRecord.getSublistSubrecord({
                  sublistId: 'addressbook',
                  fieldId: 'addressbookaddress',
                  line: 0
               });

               if (entityaddress) {
                  var address1 = entityaddress.getValue({ fieldId: 'addr1' });
                  var address2 = entityaddress.getValue({ fieldId: 'addr2' });
                  arrParticipantReg[int].address = (address1 + " " + address2);

                  arrParticipantReg[int].country = entityaddress.getValue({ fieldId: 'country' });
                  arrParticipantReg[int].zipCode = entityaddress.getValue({ fieldId: 'zip' }).replace(/-/g, '');
                  arrParticipantReg[int].district = entityaddress.getValue({ fieldId: 'custrecord_mtsdistrict' });
                  arrParticipantReg[int].IBGECityCode = entityaddress.getValue({ fieldId: 'custrecord_mts_ibgecitycode' });
                  arrParticipantReg[int].number = entityaddress.getValue({ fieldId: 'custrecord_mts_number' });
                  arrParticipantReg[int].district = entityaddress.getValue({ fieldId: 'custrecord_mtsdistrict' });
                  arrParticipantReg[int].zipCode = entityaddress.getValue({ fieldId: 'zip' }).replace(/-/g, '');
               }
            }

            if (arrParticipantReg[int].sourceType == 2) {//SALE

               arrParticipantReg[int].description = customerRecord.getValue({ fieldId: 'entityid' });


               //var address = customerRecord.getValue({fieldId: 'defaultaddress'});
               //arrParticipantReg[int].address = address.substring(0,60);


               if (customerRecord.getValue({ fieldId: 'custentity_mts_categoryloc' }) == '1-Person') {
                  var cpf = customerRecord.getValue({ fieldId: 'custentity_mts_cnpjcpf' });
                  arrParticipantReg[int].cpf = cpf.replace(/[^0-9]/g, '');
               }

               if (customerRecord.getValue({ fieldId: 'custentity_mts_categoryloc' }) == '2-Company') {
                  var cnpj = customerRecord.getValue({ fieldId: 'custentity_mts_cnpjcpf' });
                  arrParticipantReg[int].cnpj = cnpj.replace(/[^0-9]/g, '');
               }

               var ie = customerRecord.getValue({ fieldId: 'custentity_mts_ie' });
               if (ie.toUpperCase() == 'ISENTO') {
                  arrParticipantReg[int].ie = '';
               } else {
                  arrParticipantReg[int].ie = ie;
               }

               // Entity Address
               var entityaddress = vendorRecord.getSublistSubrecord({
                  sublistId: 'addressbook',
                  fieldId: 'addressbookaddress',
                  line: 0
               });

               if (entityaddress) {
                  var address1 = entityaddress.getValue({ fieldId: 'addr1' });
                  var address2 = entityaddress.getValue({ fieldId: 'addr2' });
                  arrParticipantReg[int].address = (address1 + " " + address2);

                  arrParticipantReg[int].country = entityaddress.getValue({ fieldId: 'country' });
                  arrParticipantReg[int].zipCode = entityaddress.getValue({ fieldId: 'zip' }).replace(/-/g, '');
                  arrParticipantReg[int].district = entityaddress.getValue({ fieldId: 'custrecord_mtsdistrict' });
                  arrParticipantReg[int].IBGECityCode = entityaddress.getValue({ fieldId: 'custrecord_mts_ibgecitycode' });
                  arrParticipantReg[int].number = entityaddress.getValue({ fieldId: 'custrecord_mts_number' });
                  arrParticipantReg[int].district = entityaddress.getValue({ fieldId: 'custrecord_mtsdistrict' });
                  arrParticipantReg[int].zipCode = entityaddress.getValue({ fieldId: 'zip' }).replace(/-/g, '');
               }
            }
         }
      }

      function insertParticipantReg(arrParticipantReg) {

         for (var i = 0; i < arrParticipantReg.length; i++) {
            var recordPartReg = record.create({ type: 'customrecord_mts_partreg' });

            recordPartReg.setValue({// DESCRIPTION
               fieldId: 'custrecord_mts_description_partreg',
               value: arrParticipantReg[i].description
            });

            recordPartReg.setValue({//COUNTRY CODE
               fieldId: 'custrecord_mts_countrycode_partreg',
               value: arrParticipantReg[i].country
            });

            recordPartReg.setValue({//ADDRESS
               fieldId: 'custrecord_mts_address_partreg',
               value: arrParticipantReg[i].address
            });

            recordPartReg.setValue({//IE
               fieldId: 'custrecord_mts_ie_part',
               value: arrParticipantReg[i].ie
            });

            recordPartReg.setValue({// CPF
               fieldId: 'custrecord_mts_cpf_partreg',
               value: arrParticipantReg[i].cpf
            });

            recordPartReg.setValue({// CNPJ
               fieldId: 'custrecord_mts_cnpj_partreg',
               value: '123123123'//arrParticipantReg[i].cnpj
            });

            recordPartReg.setValue({// NUMBER
               fieldId: 'custrecord_mts_number_partreg',
               value: arrParticipantReg[i].number
            });

            recordPartReg.setValue({//DISTRICT
               fieldId: 'custrecord_mts_district_partreg',
               value: arrParticipantReg[i].district
            });

            recordPartReg.setValue({//IBGE CITY CODE
               fieldId: 'custrecord_mts_ibgecitycode_partreg',
               value: arrParticipantReg[i].IBGECityCode
            });

            recordPartReg.save();
         }
      }

      function insertCfopAbstract(arrCFOPAbstract, taxSettlementRec) {
         var datesToProcess = taxSettlementRec.getValue({fieldId: 'custrecord_mts_dtstoproc_taxsettlem_tmp'});
         var fileName = taxSettlementRec.getValue({fieldId: 'name'});
         fileName += '_CFOPAbstractList.json';

         if (datesToProcess){
            // se ainda existir datas para processar, salva as informações em um arquivo
            var cfopAbstrAuxFile = file.create({
               name: fileName,
               contents: JSON.stringify(arrCFOPAbstract),
               folder: getFolderId(),
               fileType: file.Type.JSON
            });
            var cfopAbstrAuxFileId = cfopAbstrAuxFile.save();

            reserveAuxFileId('CFOPAbstr', cfopAbstrAuxFileId, taxSettlementRec);
         }else{
            // se não existir datas para processar, ou seja, é o ultimo dia do processamento, salva as informações na tabela
            for (var count = 0; count < arrCFOPAbstract.length; count++) {
               if (arrCFOPAbstract[count].cfopCode) {
   
                  taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs' });
   
                  // CFOP CODE
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_cfopcode_cfopabs',
                     value: arrCFOPAbstract[count].cfopCode
                  });
   
                  // CFOP DESCRIPTION
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_cfopdesc_cfopabs',
                     value: arrCFOPAbstract[count].cfopDesc || ''
                  });
   
                  // CFOP 1st. DIG.
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_cfop1stdig_cfopabs',
                     value: Number(arrCFOPAbstract[count].cfopCode.substr(0, 1))
                  });
   
                  // GL AMOUNT
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_glamount_cfopabs',
                     value: arrCFOPAbstract[count].glAmount || ''
                  });
   
                  // ICMS BASIS AMOUNT
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_icmsbamount_cfopabs',
                     value: arrCFOPAbstract[count].icmsBasisAmount || ''
                  });
   
                  // ICMS EXEMPT AMOUNT
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_icmsexamount_cfopabs',
                     value: arrCFOPAbstract[count].icmsExemptAmount || ''
                  });
   
                  //ICMS OTHERS AMOUNT
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_icmsothamount_cfopabs',
                     value: arrCFOPAbstract[count].icmsOthersAmount || ''
                  });
   
                  //ICMS AMOUNT
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_icmsamount_cfopabs',
                     value: arrCFOPAbstract[count].icmsAmount || ''
                  });
   
                  //IPI BASIS AMOUNT
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_ipibasamount_cfopabs',
                     value: arrCFOPAbstract[count].ipiBasisAmount || ''
                  });
   
                  //IPI EXEMPT AMOUNT
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_ipiexeamount_cfopabs',
                     value: arrCFOPAbstract[count].ipiExemptAmount || ''
                  });
   
                  //IPI OTHERS AMOUNT
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_ipiothamount_cfopabs',
                     value: arrCFOPAbstract[count].ipiOthersAmount || ''
                  });
   
                  //IPI AMOUNT
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_ipiamount_cfopabs',
                     value: arrCFOPAbstract[count].ipiAmount || ''
                  });
   
                  //FISCAL TYPE
                  taxSettlementRec.setCurrentSublistValue({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs',
                     fieldId: 'custrecord_mts_fiscaltype_cfopabs',
                     value: arrCFOPAbstract[count].fiscalType || ''
                  });
   
                  taxSettlementRec.commitLine({
                     sublistId: 'recmachcustrecord_mts_taxsettement_cfopabs'
                  });
               }
            }

            // limpa o arquivo
            var cfopAbstrAuxFile = file.create({
               name: fileName,
               contents: JSON.stringify([]),
               folder: getFolderId(),
               fileType: file.Type.JSON
            });
            var cfopAbstrAuxFileId = cfopAbstrAuxFile.save();

            reserveAuxFileId('CFOPAbstr', cfopAbstrAuxFileId, taxSettlementRec);
         }
      }   

      function insertStateAbstract(StateAbstractList, taxSettlementRec) {
         var datesToProcess = taxSettlementRec.getValue({fieldId: 'custrecord_mts_dtstoproc_taxsettlem_tmp'});
         var fileName = taxSettlementRec.getValue({fieldId: 'name'});
         fileName += '_StateAbstractList.json';

         if (datesToProcess){
            // se ainda existir datas para processar, salva as informações em um arquivo
            var stateAbstrAuxFile = file.create({
               name: fileName,
               contents: JSON.stringify(StateAbstractList),
               folder: getFolderId(),
               fileType: file.Type.JSON
            });
            var stateAbstrAuxFileId = stateAbstrAuxFile.save();

            reserveAuxFileId('StateAbstr', stateAbstrAuxFileId, taxSettlementRec);
         }else{
            for (var count = 0; count < StateAbstractList.length; count++) {

               var territoryCode = StateAbstractList[count].territoryCode;
               var fiscalType = StateAbstractList[count].fiscalType;
               var glamount = StateAbstractList[count].glamount;
               var glamount1 = StateAbstractList[count].glamount1;
               var glamount2 = StateAbstractList[count].glamount2;
               var glamount3 = StateAbstractList[count].glamount3;
               var fiscalValues = StateAbstractList[count].fiscalValues;
   
               for (var i = 0; i < fiscalValues.length; i++) {
   
                  taxSettlementRec.selectNewLine({
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs'
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // G/L Amount
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_glamount_stateabs',
                     value: fiscalValues[i].glamount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // G/L Amount 1
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_glamount1_stateabs',
                     value: fiscalValues[i].glamount1
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // G/L Amount 2
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_glamount2_stateabs',
                     value: fiscalValues[i].glamount2
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // G/L Amount 3
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_glamount3_stateabs',
                     value: fiscalValues[i].glamount3
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // Fiscal Type
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_fiscaltype_stateabs',
                     value: fiscalType
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // Territory Code
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_territcode_stateabs',
                     value: territoryCode
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // CFOP CODE
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_cfopcode_stateabs',
                     value: fiscalValues[i].cfopCode
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // ICMS Basis Amount
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_icmsbasamount_stateabs',
                     value: fiscalValues[i].icmsBasisAmount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // ICMS Exempt Amount
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_icmsexeamount_stateabs',
                     value: fiscalValues[i].icmsExemptAmount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // ICMS Others Amount
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_icmsotheramount_stateabs',
                     value: fiscalValues[i].icmsOthersAmount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // IPI Exempt Amount
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_ipiexeamount_stateabs',
                     value: fiscalValues[i].ipiExemptAmount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // IPI Others Amount
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_ipiothersamount_stateabs',
                     value: fiscalValues[i].ipiOthersAmount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // ICMS Amount
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_icmsamount_stateabs',
                     value: fiscalValues[i].icmsAmount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // IPI Amount
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_ipiamount_stateabs',
                     value: fiscalValues[i].ipiAmount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // CFOP Description
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_cfopdesc_stateabs',
                     value: fiscalValues[i].cfopDesc
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // CFOP 1st. Dig.
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_cfop1stdig_stateabs',
                     value: fiscalValues[i].cfopCode.substr(0, 1)
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // Base ICMS ST
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_baseicmsst_stateabs',
                     value: fiscalValues[i].stBasisAmount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // ICMS ST
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_icmsst_stateabs',
                     value: fiscalValues[i].stAmount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // IPI Basis Amount
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_basisamount_stateabs',
                     value: fiscalValues[i].ipiBasisAmount
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // ICMS Amount No Contributor
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_acmsamountnoc_stateabs',
                     value: ''
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // ICMS Basis Amount No Contr.
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_acmsbasamountnoc_stateabs',
                     value: ''
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // GIA Territory Code
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_giaterrcode_stateabs',
                     value: ''
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // Taxpayer Book Value
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_taxpaybkvalue_stateabs',
                     value: fiscalValues[i].taxpayerBookValue
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // Taxpayer Calculation Basis
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_taxpaycalcbasis_stateabs',
                     value: fiscalValues[i].taxpayerCalculationBasis
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // Non-Taxpayer Book Value
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_nontaxpaybkvalue_stateabs',
                     value: fiscalValues[i].nonContributingBookValue
                  });
   
                  taxSettlementRec.setCurrentSublistValue({ // Non-Taxpayer Calculation Basis
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs',
                     fieldId: 'custrecord_mts_nontaxpaycalcbas_stateabs',
                     value: fiscalValues[i].nonTaxpayerCalculationBasis
                  });
   
                  taxSettlementRec.commitLine({
                     sublistId: 'recmachcustrecord_mts_taxsettcode_stateabs'
                  });
               }
            }

            // limpa o arquivo
            var stateAbstrAuxFile = file.create({
               name: fileName,
               contents: JSON.stringify([]),
               folder: getFolderId(),
               fileType: file.Type.JSON
            });
            var stateAbstrAuxFileId = stateAbstrAuxFile.save();

            reserveAuxFileId('StateAbstr', stateAbstrAuxFileId, taxSettlementRec);
         }
      }

      function insertPercentAbstract(percentAbstractObj, taxSettlementRec) {
         for (var count = 0; count < percentAbstractObj.fiscalValues.length; count++) {
            var percentAbstractRec = record.create({ type: 'customrecord_mts_percabstr' });

            // taxSettlementRec.selectNewLine({
            //     sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr'
            // });

            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_taxsettcode_percabstr',
               value: taxSettlementRec.id
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_fiscaltype_percabstr',
               value: percentAbstractObj.fiscalType || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_postingdate_percabstr',
               value: percentAbstractObj.postingDate ? new Date(percentAbstractObj.postingDate) : ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_fiscaldoctype_percabstr',
               value: percentAbstractObj.fiscalDocType || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_especie_percabstr',
               value: percentAbstractObj.specie || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_sersubser_percabstr',
               value: percentAbstractObj.serSubSer || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_docnum_percabstr',
               value: percentAbstractObj.externalDocNo || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_transaction_percabstr',
               value: percentAbstractObj.tranId || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_docdate_percabstr',
               value: percentAbstractObj.docDate ? new Date(percentAbstractObj.docDate) : ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_billpaytono_percabstr',
               value: percentAbstractObj.billToPayToNo || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_terrcode_percabstr',
               value: percentAbstractObj.terrCode || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_billpaytoname_percabstr',
               value: percentAbstractObj.billToPayToName || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_ie_percabstr',
               value: percentAbstractObj.IE || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_cnpj_percabstr',
               value: percentAbstractObj.CNPJ || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_municidipamcode_percabstr',
               value: percentAbstractObj.muniDipamCode || ''
            });

            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_glamount_percabstr',
               value: percentAbstractObj.fiscalValues[count].GLAmount || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_cfopcode_percabstr',
               value: percentAbstractObj.fiscalValues[count].cfopCode || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_icmsbasamount_percabstr',
               value: percentAbstractObj.fiscalValues[count].ICMSBasisAmount || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_icmsexeamount_percabstr',
               value: percentAbstractObj.fiscalValues[count].ICMSExemptAmount || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_icmsotheramount_percabstr',
               value: percentAbstractObj.fiscalValues[count].ICMSOthersAmount || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_percicms_percabstr',
               value: percentAbstractObj.fiscalValues[count].ICMSPerc || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_icmsamount_percabstr',
               value: percentAbstractObj.fiscalValues[count].ICMSAmount || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_ipibasisamount_percabstr',
               value: percentAbstractObj.fiscalValues[count].IPIBasisAmount || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_ipiexeamount_percabstr',
               value: percentAbstractObj.fiscalValues[count].IPIExemptAmount || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_ipiothersamount_percabstr',
               value: percentAbstractObj.fiscalValues[count].IPIOthersAmount || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_ipiamount_percabstr',
               value: percentAbstractObj.fiscalValues[count].IPIAmount || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_dipamcode_percabstr',
               value: percentAbstractObj.fiscalValues[count].dipamCode || ''
            });
            percentAbstractRec.setValue({
               fieldId: 'custrecord_mts_dipamglamount_percabstr',
               value: percentAbstractObj.fiscalValues[count].dipamGlAmount || ''
            });

            if (count == 0)     // just for first line
               percentAbstractRec.setValue({
                  fieldId: 'custrecord_mts_observ_percabstr',
                  value: percentAbstractObj.observations || ''
               });

            // taxSettlementRec.commitLine({
            //     sublistId: 'recmachcustrecord_mts_taxsettcode_percabstr'
            // });
            var percentAbstractId = percentAbstractRec.save();
         }
      }

      function getAmounts(arrDetailLocVatEntry, objGlobalVars) {

         var objGetAmounts = {}

         if (arrDetailLocVatEntry.taxidentificati == 2) { //ICMS

            if (arrDetailLocVatEntry.directimport) {
               var exemptAmount = arrDetailLocVatEntry.exemptBasisAmount + objGlobalVars.chargeBaseExempt

            } else {
               var exemptAmount = arrDetailLocVatEntry.exemptBasisAmount
               var amount = arrDetailLocVatEntry.amount
            }


            if (!arrDetailLocVatEntry.amountnotaxcredit) {

               if (arrDetailLocVatEntry.directimport) {

                  if (arrDetailLocVatEntry.invoicelinetype != "FxdAsset") {
                     var amount = Math.abs(arrDetailLocVatEntry.amount) + objGlobalVars.chargeAmount
                     var basisAmount = Math.abs(arrDetailLocVatEntry.Base) + objGlobalVars.chargeBase
                     var othersAmount = Math.abs(arrDetailLocVatEntry.othersBasisAmount) + Math.abs(objGlobalVars.chargeGLAmountICMS)

                  } else {
                     var othersAmount = (arrDetailLocVatEntry.grossAmount - objGlobalVars.chargeGLAmountICMS) -
                        (arrDetailLocVatEntry.exemptBasisAmount - objGlobalVars.chargeBaseExempt)
                  }

               } else {
                  var basisAmount = Math.abs(arrDetailLocVatEntry.Base) + objGlobalVars.chargeBase
                  var othersAmount = Math.abs(arrDetailLocVatEntry.othersBasisAmount)
               }

            } else {
               var othersAmount = Math.abs(arrDetailLocVatEntry.othersBasisAmount) + objGlobalVars.chargeBase
            }

         }

         if (arrDetailLocVatEntry.taxidentificati == 1) { //IPI

            if (!arrDetailLocVatEntry.amountnotaxcredit) {
               var basisAmount = Math.abs(arrDetailLocVatEntry.Base) + objGlobalVars.chargeBase
               var othersAmount = Math.abs(arrDetailLocVatEntry.othersBasisAmount) + objGlobalVars.chargeBaseIPI
            } else {
               var othersAmount = arrDetailLocVatEntry.grossAmount + objGlobalVars.chargeGLAmount
            }

            var exemptAmount = arrDetailLocVatEntry.exemptBasisAmount
            var amount = Math.abs(arrDetailLocVatEntry.amount) + objGlobalVars.chargeAmount
         }

         objGetAmounts.exemptAmount = exemptAmount
         objGetAmounts.amount = amount
         objGetAmounts.basisAmount = basisAmount
         objGetAmounts.othersAmount = othersAmount

         return objGetAmounts;

      }

      function entity(rec, branchCode) {

         var banchInformation = record.load({ type: 'customrecord_mts_branchinfo', id: branchCode });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_branchcode_entity',
            value: banchInformation.getValue({ fieldId: 'altname' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_description_entity',
            value: banchInformation.getValue({ fieldId: 'altname' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_cnpj_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_cnpj_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_uf_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_territorycode_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_ibgecitycode_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_ibgecitycode_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_stateinscr_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_ie_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_cityinscr_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_ccm_branchinfo' })
         });

         // rec.setSublistValue({
         //     sublistId:'customrecord_mts_entityloc',
         //     fieldId: 'custrecord_mts_profapres_entity',
         //     value: banchInformation.getValue({ fieldId: 'altname' })
         // });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_acttypeold_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_activitytype_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_postalcode_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_shiptopostcode_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_address_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_address_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_number_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_number_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_complement_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_complement_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_district_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_district_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_phone_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_phoneno_branchinfo' })
         });

         // rec.setSublistValue({
         //     sublistId:'customrecord_mts_entityloc',
         //     fieldId: 'custrecord_mts_fax_entity',
         //     value: banchInformation.getValue({ fieldId: 'custrecord_mts_fax_entity' })
         // });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_email_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_email_branchinfo' })
         });

         rec.setSublistValue({
            sublistId: 'customrecord_mts_entityloc',
            fieldId: 'custrecord_mts_indlegal_entity',
            value: banchInformation.getValue({ fieldId: 'custrecord_mts_indicatorofthe_branchinfo' })
         });

      }

      function reserveAuxFileId(block, auxFileId, taxSettlementRec) {
         var auxFilesTxt = taxSettlementRec.getValue({fieldId: 'custrecord_mts_auxfilesjs_taxsettlem_tmp'})

         var auxFilesObj = {}
         if (auxFilesTxt){
            auxFilesObj = JSON.parse(auxFilesTxt);
         }
          
         // switch (block) {
         //    case 'E300':
         //       auxFilesObj.E300AuxFileId = auxFileId;
         //       break;
         //    case 'CFOPAbst':
         //       auxFilesObj.CFOPAbstrAuxFileId = auxFileId;
         //       break;
         //    case 'StateAbst':
         //       auxFilesObj.StateAbstrAuxFileId = auxFileId;
         //       break;
         
         //    default:
         //       break;
         // }

         var propName = block + 'AuxFileId';
         auxFilesObj[propName] = auxFileId;

         taxSettlementRec.setValue({fieldId: 'custrecord_mts_auxfilesjs_taxsettlem_tmp', value: JSON.stringify(auxFilesObj)});

      }

      /* #region  BLOCO 0  */

      //---------------- INICIO BLOCO 0 -------------\\
      function insert0150(_0150List, taxSettlementRec) {
         var datesToProcess = taxSettlementRec.getValue({fieldId: 'custrecord_mts_dtstoproc_taxsettlem_tmp'});
         var fileName = taxSettlementRec.getValue({fieldId: 'name'});
         fileName += '_0150List.json';

         if (datesToProcess){
            // se ainda existir datas para processar, salva as informações em um arquivo
            var _0150AuxFile = file.create({
               name: fileName,
               contents: JSON.stringify(_0150List),
               folder: getFolderId(),
               fileType: file.Type.JSON
            });
            var _0150AuxFileId = _0150AuxFile.save();

            reserveAuxFileId('_0150', _0150AuxFileId, taxSettlementRec);
         }else{
            for (var index = 0; index < _0150List.length; index++) {
               var _0150Obj = _0150List[index];

               // if (_0150Obj.mustBeCreated != undefined && _0150Obj.mustBeCreated != null && _0150Obj.mustBeCreated == false)
               //    continue;
               
               taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettcode_partreg' });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_code_partreg',
                  value: _0150Obj.code
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_branchcode_partreg',
                  value: _0150Obj.branchCode || ''
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_description_partreg',
                  value: _0150Obj.description
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_countrycode_partreg',
                  value: _0150Obj.countryCode
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_cnpj_partreg',
                  value: _0150Obj.cnpj
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_cpf_partreg',
                  value: _0150Obj.cpf
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_ie_part',
                  value: _0150Obj.ie
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_ibgecitycode_partreg',
                  value: _0150Obj.ibgeCityCode
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_sufrcode_partreg',
                  value: _0150Obj.suframa
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_address_partreg',
                  value: _0150Obj.address
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_number_partreg',
                  value: _0150Obj.number
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_taxsettcode_partreg',
                  fieldId: 'custrecord_mts_district_partreg',
                  value: _0150Obj.district
               });
               taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettcode_partreg' });
               
               
               // var partRegRec = record.create({ type: 'customrecord_mts_partreg' });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_taxsettcode_partreg', value: taxSettlementRec.id });

               // partRegRec.setValue({ fieldId: 'custrecord_mts_code_partreg', value: _0150Obj.code });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_branchcode_partreg', value: _0150Obj.branchCode || '' });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_description_partreg', value: _0150Obj.description });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_countrycode_partreg', value: _0150Obj.countryCode });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_cnpj_partreg', value: _0150Obj.cnpj });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_cpf_partreg', value: _0150Obj.cpf });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_ie_part', value: _0150Obj.ie });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_ibgecitycode_partreg', value: _0150Obj.ibgeCityCode });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_sufrcode_partreg', value: _0150Obj.suframa });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_address_partreg', value: _0150Obj.address });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_number_partreg', value: _0150Obj.number });
               // partRegRec.setValue({ fieldId: 'custrecord_mts_district_partreg', value: _0150Obj.district });
               // //insert0175(_0150Obj._0175List, partRegRec)

               // partRegRec.save();
            }

            var _0150AuxFile = file.create({
               name: fileName,
               contents: JSON.stringify([]),
               folder: getFolderId(),
               fileType: file.Type.JSON
            });
            var _0150AuxFileId = _0150AuxFile.save();

            reserveAuxFileId('_0150', _0150AuxFileId, taxSettlementRec);
         }
      }

      function insert0190(_0190List, taxSettlementRec) {
         for (var index = 0; index < _0190List.length; index++) {
            var _0190Obj = _0190List[index];

            if (_0190Obj.mustBeCreated != undefined && _0190Obj.mustBeCreated != null && _0190Obj.mustBeCreated == false)
               continue;

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure' });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure',
               fieldId: 'custrecord_mts_code_unitmeasure',
               value: _0190Obj.code
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure',
               fieldId: 'custrecord_mts_unitmeasucode_untimeasure',
               value: _0190Obj.unitMeasureCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure',
               fieldId: 'custrecord_mts_description_unitmeasure',
               value: _0190Obj.description
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure',
               fieldId: 'custrecord_mts_branchcode_unitmeasure',
               value: _0190Obj.branchCode || ''
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettlem_unitmeasure' });
         }
      }

      function insert0200(_0200List, taxSettlementRec) {
         for (var index = 0; index < _0200List.length; index++) {
            var _0200Obj = _0200List[index];

            if (_0200Obj.mustBeCreated != undefined && _0200Obj.mustBeCreated != null && _0200Obj.mustBeCreated == false)
               continue;

            var efdProdRec = record.create({ type: 'customrecord_mts_efdprod', isDynamic: true });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_taxsettl_efdprod', value: taxSettlementRec.id });

            efdProdRec.setValue({ fieldId: 'custrecord_mts_branchcode_efdprod', value: _0200Obj.branchCode || '' });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_productcode_efdprod', value: _0200Obj.type });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_srcode_efdprod', value: _0200Obj.servicecode });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_prodorderno_efdprod', value: _0200Obj.prodOrderNo });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_description_efdprod', value: _0200Obj.description });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_descriptiontwo_efdprod', value: _0200Obj.descriptionTwo });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_unitmeasurefixet_efdprod', value: _0200Obj.unitofmeasure });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_nbmsh_efdprod', value: _0200Obj.nbmSh });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_exccodenbmsh_efdprod', value: _0200Obj.excCodeNbmSh });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_icmspercent_efdprod', value: _0200Obj.icmsPerc });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_cestcode_efdprod', value: _0200Obj.cestCode });
            efdProdRec.setValue({ fieldId: 'custrecord_mts_itemtype_efdprod', value: _0200Obj.itemType });

            // insert0210(_0200Obj._0210List, efdProdRec);
            insert0220(_0200Obj._0220List, efdProdRec);

            efdProdRec.save();
         }

      }

      function insert0210(_0210List, efdProdRec) {
         var taxSettlmentId = partRegRec.getValue({ fieldId: 'taxweewst' });

         for (var index = 0; index < _0210List.length; index++) {
            var _0210Obj = _0210List[index];

            efdProdRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_eefdprod_consspecstan' });
            efdProdRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_eefdprod_consspecstan',
               fieldId: 'taxset',
               value: taxSettlmentId
            });

            efdProdRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_eefdprod_consspecstan',
               fieldId: 'custrecord_mts_itemno_consspecstan',
               value: _0210Obj.fieldA
            });

            efdProdRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_eefdprod_consspecstan',
               fieldId: 'custrecord_mts_qtdtotal_consspecstan',
               value: _0210Obj.fieldB
            });

            efdProdRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_eefdprod_consspecstan',
               fieldId: 'custrecord_mts_scrappercent_consspecstan',
               value: _0210Obj.fieldB
            });

            efdProdRec.commitLine({ sublistId: 'recmachcustrecord_mts_eefdprod_consspecstan' });
         }
      }

      function insert0220(_0220List, efdProdRec) {
         var taxSettlmentId = efdProdRec.getValue({ fieldId: 'custrecord_mts_taxsettl_efdprod' });

         for (var index = 0; index < _0220List.length; index++) {
            var _0220Obj = _0220List[index];

            efdProdRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_eefdprod_itemunitmeasu' });
            efdProdRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_eefdprod_itemunitmeasu',
               fieldId: 'custrecord_mts_taxsettleme_itemunitmeasu',
               value: taxSettlmentId
            });

            efdProdRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_eefdprod_itemunitmeasu',
               fieldId: 'custrecord_mts_code_itemunitmeasure',
               value: _0220Obj.code
            });

            efdProdRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_eefdprod_itemunitmeasu',
               fieldId: 'custrecord_mts_qtyunimea_itemunitmeasure',
               value: _0220Obj.qtyUnitMeasure
            });

            efdProdRec.commitLine({ sublistId: 'recmachcustrecord_mts_eefdprod_itemunitmeasu' });
         }
      }

      function insert0300(_0300List, taxSettlementRec) {
         for (var index = 0; index < _0300List.length; index++) {
            var _0300Obj = _0300List[index];

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset' });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset',
               fieldId: 'custrecord_mts_no_spedfixasset',
               value: _0300Obj.fixedAssetId
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset',
               fieldId: 'custrecordmts_mainassetcomp_spedfixasset',
               value: _0300Obj.component
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset',
               fieldId: 'custrecord_mts_desc_spedfixasset',
               value: _0300Obj.description
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset',
               fieldId: 'custrecord_mts_compmainasse_spedfixasset',
               value: _0300Obj.mainFixedAsset
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset',
               fieldId: 'custrecord_mts_aquisicosacc_spedfixasset',
               value: _0300Obj.account
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset',
               fieldId: 'custrecord_mts_qtyicmsapp_spedfixasset',
               value: _0300Obj.numberInstallments
            });


            //insert0305
            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset',
               fieldId: 'custrecord_mts_globdimen1co_spedfixasset',
               value: _0300Obj.costCenter
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset',
               fieldId: 'custrecord_mts_funcdesc_spedfixasset',
               value: _0300Obj.functionDescription
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset',
               fieldId: 'custrecord_mts_quantvalimon_spedfixasset',
               value: _0300Obj.lifeTime
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettlemen_spedfixasset' });
         }
      }

      function insert0400(_0400List, taxSettlementRec) {

         for (var a = 0; a < _0400List.length; a++) {
            if (_0400List[a].code) {
               if (_0400List[a].mustBeCreated != undefined && _0400List[a].mustBeCreated != null && _0400List[a].mustBeCreated == false)
                  continue;

               taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_code_opernat' });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_code_opernat',
                  fieldId: 'custrecord_mts_codee_opernat',
                  value: _0400List[a].code
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_code_opernat',
                  fieldId: 'custrecord_mts_desc_opernat',
                  value: _0400List[a].description
               });
               taxSettlementRec.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_mts_code_opernat',
                  fieldId: 'custrecord_mts_branchcode_opernat',
                  value: _0400List[a].branchCode
               });

               taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_code_opernat' });
            }
         }

      }

      function insert0500(_0500List, taxSettlementRec) {
         for (var a = 0; a < _0500List.length; a++) {
            var _0500Obj = _0500List[a];

            if (_0500Obj.mustBeCreated != undefined && _0500Obj.mustBeCreated != null && _0500Obj.mustBeCreated == false)
                  continue;

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettle_glaccount' });
            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
               fieldId: 'custrecord_mts_lastdatemodi_glaccount',
               value: _0500Obj.changeDate ? new Date(_0500Obj.changeDate) : ''
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
               fieldId: 'custrecord_mts_acctype_glaccount',
               value: _0500Obj.accountType
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
               fieldId: 'custrecord_mts_indentation_glaccount',
               value: _0500Obj.indentation
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
               fieldId: 'custrecord_mts_no_glaccount',
               value: _0500Obj.accountCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
               fieldId: 'custrecord_mts_name_glaccount',
               value: _0500Obj.accountName
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettle_glaccount',
               fieldId: 'custrecord_mts_nivel_glaccount',
               value: _0500Obj.nivel
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettle_glaccount' });
         }
      }

      function insert0600(_0600List, taxSettlementRec) {
         for (var index = 0; index < _0600List.length; index++) {
            var _0600Obj = _0600List[index];

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxset_dimenval' });
            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxset_dimenval',
               fieldId: 'custrecord_mts_lastdatemod_dimenval',
               value: _0600Obj.lastDateChange ? new Date(_0600Obj.lastDateChange) : ''
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxset_dimenval',
               fieldId: 'custrecord_mts_code_dimenval',
               value: _0600Obj.id
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxset_dimenval',
               fieldId: 'custrecord_mts_name_dimenval',
               value: _0600Obj.name
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxset_dimenval' });
         }
      }
      //---------------- FIM BLOCO 0 ----------------\\

      /* #endregion */


      /* #region  BLOCO B  */

      //---------------- INICIO BLOCO B -------------\\


      //---------------- FIM BLOCO B ----------------\\

      /* #endregion */


      /* #region  BLOCO A  */

      //---------------- INICIO BLOCO A -------------\\
      function insertA100(_a100Obj, taxSettlementRec) {
         var summaryInvoiceRec = record.create({ type: 'customrecord_mts_summaryinv', isDynamic: true });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv', value: taxSettlementRec.id });

         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscalmodelcod_summaryinv', value: _a100Obj.fiscalmodelcod });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_transaction_summaryinv', value: _a100Obj.tranId });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscaltype_summaryinv', value: _a100Obj.fiscaltype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_shiptodoc_summaryinv', value: _a100Obj.shiptodoc });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_taxsituation_summaryinv', value: _a100Obj.taxsituation });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_seriesub_summaryinv', value: _a100Obj.seriesub });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_docno_summaryinv', value: _a100Obj.docno });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_einvkey_summaryinv', value: _a100Obj.einvkey });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_docdate_summaryinv', value: _a100Obj.docdate ? new Date(_a100Obj.docdate) : '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_glamount_summaryinv', value: _a100Obj.glamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_paymenttype_summaryinv', value: _a100Obj.paymenttype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_brdiscount_summaryinv', value: _a100Obj.brdiscount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsbasisamoun_summaryinv', value: _a100Obj.icmsbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_pisamount_summaryinv', value: _a100Obj.pisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cofinsamount_summaryinv', value: _a100Obj.cofinsamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cofinsret_summaryinv', value: _a100Obj.cofinsret });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_pisret_summaryinv', value: _a100Obj.pisret });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_iss_summaryinv', value: _a100Obj.iss });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscdoctype_summaryinv', value: _a100Obj.fiscaldoctype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_documenttype_summaryinv', value: _a100Obj.documenttype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_originalcfop_summaryinv', value: _a100Obj.cfopcode });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_notsubjecticms_summaryinv', value: _a100Obj.notsubjecticms || false });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_pisbasisamt_summaryinv', value: _a100Obj.pisbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cofinsbasisamt_summaryinv', value: _a100Obj.cofinsbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_branch_summaryinv', value: _a100Obj.branchCode || '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_billtopayto_summaryinv', value: _a100Obj.billtopayto });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_territorycode_summaryinv', value: _a100Obj.territoryCode });

         //A120
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_servexecabroad_summaryinv', value: _a100Obj.serviceExecutedAbroad || false });


         insertA110(_a100Obj._a110List, summaryInvoiceRec);
         insertA170(_a100Obj._a170List, summaryInvoiceRec);

         var summaryInvoiceId = summaryInvoiceRec.save();
      }

      function insertA110(_a110List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _a110List.length; index++) {
            var _a110Obj = _a110List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_adddttx' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_adddttx',
               fieldId: 'custrecord_mts_taxsettcode_adddttx',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_adddttx',
               fieldId: 'custrecord_mts_spedaddc_adddttx',
               value: _a110Obj.spedaddc
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_adddttx',
               fieldId: 'custrecord_mts_text_adddttx',
               value: _a110Obj.text
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_adddttx',
               fieldId: 'custrecord_mts_branchcode_adddttx',
               value: _a110Obj.branchCode
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_adddttx' });
         }
      }

      function insertA170(_a170List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _a170List.length; index++) {
            var _a170Obj = _a170List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_taxsettlement_ebuffer',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_no_ebuffer',
               value: _a170Obj.no
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_description_ebuffer',
               value: _a170Obj.description
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_lineamount_ebuffer',
               value: _a170Obj.lineamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cfopcode_ebuffer',
               value: _a170Obj.cfopcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_seqcfopcode_ebuffer',
               value: _a170Obj.sqcfopcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_piscstcode_ebuffer',
               value: _a170Obj.piscstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_pisbasisamount_ebuffer',
               value: _a170Obj.pisbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_pispercent_ebuffer',
               value: _a170Obj.pispercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_pisamount_ebuffer',
               value: _a170Obj.pisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cofinscstcode_ebuffer',
               value: _a170Obj.cofinscstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cofinsbasamount_ebuffer',
               value: _a170Obj.cofinsbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cofinspercent_ebuffer',
               value: _a170Obj.cofinspercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cofinsamount_ebuffer',
               value: _a170Obj.cofinsamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_codenaturebasis_ebuffer',
               value: _a170Obj.codeBaseCalcCredit
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_creditosource_ebuffer',
               value: _a170Obj.creditSource
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_accountno_ebuffer',
               value: _a170Obj.accountno
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_branchcode_ebuffer',
               value: _a170Obj.branchCode || ''
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer' });
         }
      }

      //---------------- FIM BLOCO A ----------------\\


      /* #endregion */


      /* #region  BLOCO C  */

      //---------------- INICIO BLOCO C -------------\\
      function insertC100(_c100Obj, taxSettlementRec) {
         var summaryInvoiceRec = record.create({ type: 'customrecord_mts_summaryinv', isDynamic: true });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv', value: taxSettlementRec.id });

         //insertC001
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscalmodelcod_summaryinv', value: _c100Obj.fiscalmodelcod });

         //insertC100
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_transaction_summaryinv', value: _c100Obj.tranId });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscaltype_summaryinv', value: _c100Obj.fiscaltype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_shiptodoc_summaryinv', value: _c100Obj.shiptodoc });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_taxsituation_summaryinv', value: _c100Obj.taxsituation });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_seriesub_summaryinv', value: _c100Obj.seriesub });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_docno_summaryinv', value: _c100Obj.docno });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_einvkey_summaryinv', value: _c100Obj.einvkey });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_docdate_summaryinv', value: _c100Obj.docdate ? new Date(_c100Obj.docdate) : '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_postdate_summaryinv', value: _c100Obj.postdate ? new Date(_c100Obj.postdate) : '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_glamount_summaryinv', value: _c100Obj.glamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_paymenttype_summaryinv', value: _c100Obj.paymenttype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_brdiscount_summaryinv', value: _c100Obj.brdiscount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_exemptionicms_summaryinv', value: _c100Obj.exemptionicms });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_lineamount_summaryinv', value: _c100Obj.lineamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_freightbillet_summaryinv', value: _c100Obj.freightbillet });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_freightamount_summaryinv', value: _c100Obj.freightamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_insuranceamoun_summaryinv', value: _c100Obj.insuranceamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_otherdispanamt_summaryinv', value: _c100Obj.otherdispanamt });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsbasisamoun_summaryinv', value: _c100Obj.icmsbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsamount_summaryinv', value: _c100Obj.icmsamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsstbasis_summaryinv', value: _c100Obj.icmsstbasis });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsstamount_summaryinv', value: _c100Obj.icmsstamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_ipiamount_summaryinv', value: _c100Obj.ipiamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_pisamount_summaryinv', value: _c100Obj.pisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cofinsamount_summaryinv', value: _c100Obj.cofinsamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_glamount1_summaryinv', value: _c100Obj.glamount1 });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_glamount2_summaryinv', value: _c100Obj.glamount2 });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_itemmov_summaryinv', value: _c100Obj.itemmov || false });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsothers_summaryinv', value: _c100Obj.icmsothersbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsexemamount_summaryinv', value: _c100Obj.icmsexemptamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cfopcode_summaryinv', value: _c100Obj.cfopcode });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icms_summaryinv', value: _c100Obj.icmsperc });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_ipiothersamt_summaryinv', value: _c100Obj.ipiothersbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_billtopayto_summaryinv', value: _c100Obj.billtopayto });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_billtopayname_summaryinv', value: _c100Obj.billtopaytoName });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cnpj_summaryinv', value: _c100Obj.cnpj });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_ie_summaryinv', value: _c100Obj.ie });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_territorycode_summaryinv', value: _c100Obj.territorycode });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cofinsret_summaryinv', value: _c100Obj.cofinsret });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_pisret_summaryinv', value: _c100Obj.pisret });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_iss_summaryinv', value: _c100Obj.iss });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cfopdescriptio_summaryinv', value: _c100Obj.cfopdescription });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_ipibaseamt_summaryinv', value: _c100Obj.ipibasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_ipiexemptamt_summaryinv', value: _c100Obj.ipiexemptamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_ipiothersamt_summaryinv', value: _c100Obj.ipiothersbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_glamount3_summaryinv', value: _c100Obj.glamount3 });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscdoctype_summaryinv', value: _c100Obj.fiscaldoctype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_documenttype_summaryinv', value: _c100Obj.documenttype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_originalcfop_summaryinv', value: _c100Obj.cfopcode });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_csrf_summaryinv', value: _c100Obj.csrf });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_amticmsuf_summaryinv', value: _c100Obj.amounticmsufdest });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_amounticmsuf_summaryinv', value: _c100Obj.amounticmsufrem });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_notsubjecticms_summaryinv', value: _c100Obj.notsubjecticms || false });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_pisbasisamt_summaryinv', value: _c100Obj.pisbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cofinsbasisamt_summaryinv', value: _c100Obj.cofinsbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_transshiptotyp_summaryinv', value: _c100Obj.transportShipToType });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_branch_summaryinv', value: _c100Obj.branchCode || '' });


         //insertC101
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_amountfcp_summaryinv', value: _c100Obj.amountfcp });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_amticmsuf_summaryinv', value: _c100Obj.amticmsuf });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_amounticmsuf_summaryinv', value: _c100Obj.amounticmsuf });

         //insertC140
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_credittitletyp_summaryinv', value: _c100Obj.credittitletyp });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_complcredtitle_summaryinv', value: _c100Obj.complcredtitle });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_numberofplots_summaryinv', value: _c100Obj.numberofplots });

         //insertC160
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_transpqty_summaryinv', value: _c100Obj.transportedquant || 0 });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_grossweight_summaryinv', value: _c100Obj.grossweight || 0 });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_netweight_summaryinv', value: _c100Obj.netweight || 0 });

         insertC120(_c100Obj._c120List, summaryInvoiceRec);
         // insertC130(_c100Obj._c130List, summaryInvoiceRec);
         insertC141(_c100Obj._c141List, summaryInvoiceRec);
         insertC170(_c100Obj._c170List, summaryInvoiceRec);
         insertC190(_c100Obj._c190List, summaryInvoiceRec);
         insertC195(_c100Obj._c195List, summaryInvoiceRec);

         var summaryInvoiceId = summaryInvoiceRec.save();

         insertC110(_c100Obj._c110List, summaryInvoiceRec);
      }

      function insertC110(_c110List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _c110List.length; index++) {
            var _c110Obj = _c110List[index];

            var _c110Rec = record.create({ type: 'customrecord_mts_adddttx', isDynamic: true });
            _c110Rec.setValue({ fieldId: 'custrecord_mts_summaryinvoice_adddttx', value: summaryInvoiceRec.id });
            _c110Rec.setValue({ fieldId: 'custrecord_mts_taxsettcode_adddttx', value: taxSetId });

            _c110Rec.setValue({ fieldId: 'custrecord_mts_spedaddc_adddttx', value: _c110Obj.spedaddc });
            _c110Rec.setValue({ fieldId: 'custrecord_mts_text_adddttx', value: _c110Obj.text });
            _c110Rec.setValue({ fieldId: 'custrecord_mts_branchcode_adddttx', value: _c110Obj.branchCode });

            insertC113(_c110Obj._c113List, _c110Rec);
            //insertC115(_c110Obj._c115List, _c110Rec);

            var _c110Id = _c110Rec.save();
         }
      }

      function insertC113(_c113List, _c110Rec) {
         var taxSetId = _c110Rec.getValue({ fieldId: 'custrecord_mts_taxsettcode_adddttx' });

         for (var index = 0; index < _c113List.length; index++) {
            var _c113Obj = _c113List[index];

            _c110Rec.selectNewLine({ sublistId: 'recmachcustrecord_mts_adddatatext_docfisref' });
            _c110Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_adddatatext_docfisref',
               fieldId: 'custrecord_mts_taxsett_docfiscref',
               value: taxSetId
            });

            _c110Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_adddatatext_docfisref',
               fieldId: 'custrecord_mts_billtopaytono_docfiscref',
               value: _c113Obj.billtopaytono
            });

            _c110Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_adddatatext_docfisref',
               fieldId: 'custrecord_mts_fiscaltype_docfisref',
               value: _c113Obj.fiscaltype
            });

            _c110Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_adddatatext_docfisref',
               fieldId: 'custrecord_mts_printserie_docfisref',
               value: _c113Obj.printserie
            });

            _c110Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_adddatatext_docfisref',
               fieldId: 'custrecord_mts_printsubserie_docfisref',
               value: _c113Obj.printsubserie
            });

            _c110Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_adddatatext_docfisref',
               fieldId: 'custrecord_mts_externaldocno_docfisref',
               value: _c113Obj.externaldocno
            });

            _c110Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_adddatatext_docfisref',
               fieldId: 'custrecord_mts_nfeketacess_docfisref',
               value: _c113Obj.nfeketacess
            });

            _c110Rec.commitLine({ sublistId: 'recmachcustrecord_mts_adddatatext_docfisref' });
         }
      }

      function insertC120(_c120List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _c120List.length; index++) {
            var _c120Obj = _c120List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinv_importoper' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_importoper',
               fieldId: 'custrecord_mts_taxset_importoper',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_importoper',
               fieldId: 'custrecord_mts_dino_importoper',
               value: _c120Obj.dino
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_importoper',
               fieldId: 'custrecord_mts_pisamount_importoper',
               value: _c120Obj.pisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_importoper',
               fieldId: 'custrecord_mts_cofinsamount_importoper',
               value: _c120Obj.cofinsamount
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinv_importoper' });
         }
      }

      function insertC141(_c141List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _c141List.length; index++) {
            var _c141Obj = _c141List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_invoicedue' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_invoicedue',
               fieldId: 'custrecord_mts_taxsett_invoicedue',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_invoicedue',
               fieldId: 'custrecord_mts_installmentno_invoicedue',
               value: _c141Obj.installmentno
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_invoicedue',
               fieldId: 'custrecord_mts_duedate_invoicedue',
               value: _c141Obj.duedate ? new Date(_c141Obj.duedate) : ''
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_invoicedue',
               fieldId: 'custrecord_mts_amountlcy_invoicedue',
               value: _c141Obj.amountlcy
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_invoicedue' });
         }
      }

      function insertC170(_c170List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _c170List.length; index++) {
            var _c170Obj = _c170List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_taxsettlement_ebuffer',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_servicecode_ebuffer',
               value: _c170Obj.servicecode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_no_ebuffer',
               value: _c170Obj.no
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_description_ebuffer',
               value: _c170Obj.description
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_linequantity_ebuffer',
               value: _c170Obj.linequantity
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_unitofmesure_ebuffer',
               value: _c170Obj.unitofmeasure
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_lineamount_ebuffer',
               value: _c170Obj.lineamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cstcode_ebuffer',
               value: _c170Obj.cstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cfopcode_ebuffer',
               value: _c170Obj.cfopcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_seqcfopcode_ebuffer',
               value: _c170Obj.sqcfopcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_icmsbasisamount_ebuffer',
               value: _c170Obj.icmsbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_icmspercent_ebuffer',
               value: _c170Obj.icmspercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_icmsamount_ebuffer',
               value: _c170Obj.icmsamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_icmstsbasisamount_ebuffer',
               value: _c170Obj.icmsstbasis
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_icmstsamount_ebuffer',
               value: _c170Obj.icmsstamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_ipicstcode_ebuffer',
               value: _c170Obj.ipicstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_ipibasisamount_ebuffer',
               value: _c170Obj.ipibasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_ipipercent_ebuffer',
               value: _c170Obj.ipipercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_ipiamount_ebuffer',
               value: _c170Obj.ipiamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_piscstcode_ebuffer',
               value: _c170Obj.piscstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_pisbasisamount_ebuffer',
               value: _c170Obj.pisbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_pispercent_ebuffer',
               value: _c170Obj.pispercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_pisamount_ebuffer',
               value: _c170Obj.pisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cofinscstcode_ebuffer',
               value: _c170Obj.cofinscstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cofinsbasamount_ebuffer',
               value: _c170Obj.cofinsbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cofinspercent_ebuffer',
               value: _c170Obj.cofinspercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_cofinsamount_ebuffer',
               value: _c170Obj.cofinsamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_accountno_ebuffer',
               value: _c170Obj.accountno
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_exemptionicms_ebuffer',
               value: _c170Obj.exemptionicms
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_stpercent_ebuffer',
               value: _c170Obj.icmsstpercent
            });



            //insertC172
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_issqnbasisamount_ebuffer',
               value: _c170Obj.issqnbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_issqnpercent_ebuffer',
               value: _c170Obj.issqnpercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_issqnamount_ebuffer',
               value: _c170Obj.issqnamount
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer' });
         }
      }

      function insertC190(_c190List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _c190List.length; index++) {
            var _c190Obj = _c190List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_taxsettlement_analregdoc',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_cstcode_analregdoc',
               value: _c190Obj.cstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_cfopcode_analregdoc',
               value: _c190Obj.cfopcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmspercent_analregdoc',
               value: _c190Obj.icmspercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_glamount_analregdoc',
               value: _c190Obj.glamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsbasis_analregdoc',
               value: _c190Obj.icmsbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsamount_analregdoc',
               value: _c190Obj.icmsamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsstbasis_analregdoc',
               value: _c190Obj.icmsstbasis
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsstamount_analregdoc',
               value: _c190Obj.icmsstamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_ipiamount_analregdoc',
               value: _c190Obj.ipiamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsexempt_analregdoc',
               value: _c190Obj.icmsexemptamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsothersamt_analregdoc',
               value: _c190Obj.icmsothersamount
            });


            //insertC191
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_vlfcpop_analregdoc',
               value: _c190Obj.vlfcpop
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_vlfcpst_analregdoc',
               value: _c190Obj.vlfcpst
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_vlfcpret_analregdoc',
               value: _c190Obj.vlfcpret
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc' });
         }
      }

      function insertC195(_c195List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _c195List.length; index++) {
            var _c195Obj = _c195List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm',
               fieldId: 'custrecord_mts_taxsettcode_obsfiscm',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm',
               fieldId: 'custrecord_mts_addtextcode_obsfiscm',
               value: _c195Obj.addtextcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm',
               fieldId: 'custrecord_mts_addtextsubcode_obsfiscm',
               value: _c195Obj.addtextsubcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm',
               fieldId: 'custrecord_mts_text_obsfiscm',
               value: _c195Obj.text
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm' });
         }
      }

      function insertC500(_c500Obj, taxSettlementRec) {

         var summaryInvoiceRec = record.create({ type: 'customrecord_mts_summaryinv', isDynamic: true });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv', value: taxSettlementRec.id });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscaltype_summaryinv', value: _c500Obj.fiscaltype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_transaction_summaryinv', value: _c500Obj.tranId });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_billtopayto_summaryinv', value: _c500Obj.billtopayto });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_billtopayname_summaryinv', value: _c500Obj.billtopaytoName });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscalmodelcod_summaryinv', value: _c500Obj.fiscalmodelcod });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_taxsituation_summaryinv', value: _c500Obj.taxsituation });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_seriesub_summaryinv', value: _c500Obj.seriesub });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_docno_summaryinv', value: _c500Obj.docno });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_docdate_summaryinv', value: _c500Obj.docdate ? new Date(_c500Obj.docdate) : '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_postdate_summaryinv', value: _c500Obj.postdate ? new Date(_c500Obj.postdate) : '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_glamount_summaryinv', value: _c500Obj.glamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mst_accno_summaryinv', value: _c500Obj.accountno });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_ibgecode_summaryinv', value: _c500Obj.ibgecitycode });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_indieaddress_summaryinv', value: _c500Obj.indicatorIeAddressee });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_einvkey_summaryinv', value: _c500Obj.einvkey });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_typenfthree_summaryinv', value: _c500Obj.typeNf3e });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_branch_summaryinv', value: _c500Obj.branchCode || '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cfopcode_summaryinv', value: _c500Obj.cfopcode });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icms_summaryinv', value: _c500Obj.icmsperc });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_pisamount_summaryinv', value: _c500Obj.pisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cofinsamount_summaryinv', value: _c500Obj.cofinsamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_hashsubdoc_summaryinv', value: _c500Obj.hashSubDoc });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_injecenergy_summaryinv', value: _c500Obj.injectedEnergy });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_otherdedu_summaryinv', value: _c500Obj.otherDeductions });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_nfekeythird__summaryinv', value: _c500Obj.nfeKeyAccessThirdIssue });

         insertC501(_c500Obj._c501List, summaryInvoiceRec);
         insertC505(_c500Obj._c505List, summaryInvoiceRec);
         insertC590(_c500Obj._c590List, summaryInvoiceRec);

         summaryInvoiceRec.save();
      }

      function insertC501(_c501List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _c501List.length; index++) {
            var _c501Obj = _c501List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxsettcode_opcomp',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxident_opcomp',
               value: _c501Obj.taxIdent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_codenaturebasis_opcomp',
               value: _c501Obj.codeNatureBasis
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_lineamount_opcomp',
               value: _c501Obj.lineamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_cstcode_opcomp',
               value: _c501Obj.piscstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_basisamount_opcomp',
               value: _c501Obj.pisbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxpercent_opcomp',
               value: _c501Obj.pispercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxamount_opcomp',
               value: _c501Obj.pisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_accountno_opcomp',
               value: _c501Obj.accountno
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
         }
      }

      function insertC505(_c505List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _c505List.length; index++) {
            var _c505Obj = _c505List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxsettcode_opcomp',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxident_opcomp',
               value: _c505Obj.taxIdent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_codenaturebasis_opcomp',
               value: _c505Obj.codeNatureBasis
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_lineamount_opcomp',
               value: _c505Obj.lineamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_cstcode_opcomp',
               value: _c505Obj.cofinscstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_basisamount_opcomp',
               value: _c505Obj.cofinsbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxpercent_opcomp',
               value: _c505Obj.cofinspercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxamount_opcomp',
               value: _c505Obj.cofinsamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_accountno_opcomp',
               value: _c505Obj.accountno
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
         }
      }

      function insertC590(_c590List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _c590List.length; index++) {
            var _c590Obj = _c590List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_taxsettlement_analregdoc',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_cstcode_analregdoc',
               value: _c590Obj.cstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_cfopcode_analregdoc',
               value: _c590Obj.cfopcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmspercent_analregdoc',
               value: _c590Obj.icmspercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_glamount_analregdoc',
               value: _c590Obj.glamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsbasis_analregdoc',
               value: _c590Obj.icmsbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsamount_analregdoc',
               value: _c590Obj.icmsamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsexempt_analregdoc',
               value: _c590Obj.icmsexemptamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsothersamt_analregdoc',
               value: _c590Obj.icmsothersamount
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc' });
         }
      }
      //---------------- FIM BLOCO C ----------------\\


      /* #endregion */


      /* #region  BLOCO D  */

      //---------------- INICIO BLOCO D -------------\\
      function insertD100(_d100Obj, taxSettlementRec) {

         var summaryInvoiceRec = record.create({ type: 'customrecord_mts_summaryinv', isDynamic: true });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv', value: taxSettlementRec.id });

         //insertD001
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscalmodelcod_summaryinv', value: _d100Obj.fiscalmodelcod });

         //insertD100
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_transaction_summaryinv', value: _d100Obj.tranId });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscaltype_summaryinv', value: _d100Obj.fiscaltype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscdoctype_summaryinv', value: _d100Obj.fiscaldoctype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_shiptodoc_summaryinv', value: _d100Obj.shiptodoc });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_billtopayto_summaryinv', value: _d100Obj.billtopayto });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_taxsituation_summaryinv', value: _d100Obj.taxsituation });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_seriesub_summaryinv', value: _d100Obj.seriesub });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_docno_summaryinv', value: _d100Obj.docno });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_einvkey_summaryinv', value: _d100Obj.einvkey });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_docdate_summaryinv', value: _d100Obj.docdate ? new Date(_d100Obj.docdate) : '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_postdate_summaryinv', value: _d100Obj.postdate ? new Date(_d100Obj.postdate) : '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_glamount_summaryinv', value: _d100Obj.glamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_freightbillet_summaryinv', value: _d100Obj.freightbillet });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsbasisamoun_summaryinv', value: _d100Obj.icmsbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsamount_summaryinv', value: _d100Obj.icmsamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_originibge_summaryinv', value: _d100Obj.originibge });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_destibgecity_summaryinv', value: _d100Obj.destibgecity });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_branch_summaryinv', value: _d100Obj.branchCode || '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cfopcode_summaryinv', value: _d100Obj.cfopcode });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icms_summaryinv', value: _d100Obj.icmsperc });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mst_accno_summaryinv', value: _d100Obj.accountno });

         insertD101(_d100Obj._d101List, summaryInvoiceRec);
         insertD105(_d100Obj._d105List, summaryInvoiceRec);
         insertD110(_d100Obj._d110List, summaryInvoiceRec);
         insertD190(_d100Obj._d190List, summaryInvoiceRec);
         insertD195(_d100Obj._d195List, summaryInvoiceRec);

         var summaryInvoiceId = summaryInvoiceRec.save();
      }

      function insertD101(_d101List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _d101List.length; index++) {
            var _d101Obj = _d101List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxsettcode_opcomp',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxident_opcomp',
               value: _d101Obj.taxIdent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_lineamount_opcomp',
               value: _d101Obj.lineamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_cstcode_opcomp',
               value: _d101Obj.piscstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_codenaturebasis_opcomp',
               value: _d101Obj.codeNatureBasis
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_basisamount_opcomp',
               value: _d101Obj.pisbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxpercent_opcomp',
               value: _d101Obj.pispercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxamount_opcomp',
               value: _d101Obj.pisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_accountno_opcomp',
               value: _d101Obj.accountno
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_indnatfreig_opcomp',
               value: _d101Obj.indicatorNatureOfFreight
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
         }
      }

      function insertD105(_d105List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _d105List.length; index++) {
            var _d105Obj = _d105List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxsettcode_opcomp',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxident_opcomp',
               value: _d105Obj.taxIdent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_lineamount_opcomp',
               value: _d105Obj.lineamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_cstcode_opcomp',
               value: _d105Obj.cofinscstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_codenaturebasis_opcomp',
               value: _d105Obj.codeNatureBasis
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_basisamount_opcomp',
               value: _d105Obj.cofinsbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxpercent_opcomp',
               value: _d105Obj.cofinspercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxamount_opcomp',
               value: _d105Obj.cofinsamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_accountno_opcomp',
               value: _d105Obj.accountno
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_indnatfreig_opcomp',
               value: _d105Obj.indicatorNatureOfFreight
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
         }
      }

      function insertD110(_d110List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _d110List.length; index++) {
            var _d110Obj = _d110List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_taxsettcode_opcomp',
               value: taxSetId
            });

            //insertD100
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_accountno_ebuffer',
               value: _d110Obj.accountno
            });

            //insertD110
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_invoicelineno_ebuffer',
               value: _d110Obj.invoicelineno
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_no_ebuffer',
               value: _d110Obj.no
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer',
               fieldId: 'custrecord_mts_amountinclvat_ebuffer',
               value: _d110Obj.amountinclvat
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_ebuffer' });
         }
      }

      function insertD190(_d190List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _d190List.length; index++) {
            var _d190Obj = _d190List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_taxsettlement_analregdoc',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_cstcode_analregdoc',
               value: _d190Obj.cstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_cfopcode_analregdoc',
               value: _d190Obj.cfopcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmspercent_analregdoc',
               value: _d190Obj.icmspercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_glamount_analregdoc',
               value: _d190Obj.glamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsbasis_analregdoc',
               value: _d190Obj.icmsbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsamount_analregdoc',
               value: _d190Obj.icmsamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsexempt_analregdoc',
               value: _d190Obj.icmsexemptamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsothersamt_analregdoc',
               value: _d190Obj.icmsothersamount
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc' });
         }
      }

      function insertD195(_d195List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _d195List.length; index++) {
            var _d195Obj = _d195List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm',
               fieldId: 'custrecord_mts_taxsettcode_obsfiscm',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm',
               fieldId: 'custrecord_mts_addtextcode_obsfiscm',
               value: _d195Obj.addtextcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm',
               fieldId: 'custrecord_mts_addtextsubcode_obsfiscm',
               value: _d195Obj.addtextsubcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm',
               fieldId: 'custrecord_mts_text_obsfiscm',
               value: _d195Obj.text
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_obsfiscm' });
         }
      }

      function insertD500(_d500Obj, taxSettlementRec) {

         var summaryInvoiceRec = record.create({ type: 'customrecord_mts_summaryinv', isDynamic: true });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv', value: taxSettlementRec.id });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_transaction_summaryinv', value: _d500Obj.tranId });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscaltype_summaryinv', value: _d500Obj.fiscaltype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscdoctype_summaryinv', value: _d500Obj.fiscaldoctype });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_shiptodoc_summaryinv', value: _d500Obj.shiptodoc });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_billtopayto_summaryinv', value: _d500Obj.billtopayto });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_fiscalmodelcod_summaryinv', value: _d500Obj.fiscalmodelcod });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_taxsituation_summaryinv', value: _d500Obj.taxsituation });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_seriesub_summaryinv', value: _d500Obj.seriesub });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_docno_summaryinv', value: _d500Obj.docno });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_docdate_summaryinv', value: _d500Obj.docdate ? new Date(_d500Obj.docdate) : '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_postdate_summaryinv', value: _d500Obj.postdate ? new Date(_d500Obj.postdate) : '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_glamount_summaryinv', value: _d500Obj.glamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsexemamount_summaryinv', value: _d500Obj.icmsexemptamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsbasisamoun_summaryinv', value: _d500Obj.icmsbasisamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icmsamount_summaryinv', value: _d500Obj.icmsamount });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_branch_summaryinv', value: _d500Obj.branchCode || '' });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_cfopcode_summaryinv', value: _d500Obj.cfopcode });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mts_icms_summaryinv', value: _d500Obj.icmsperc });
         summaryInvoiceRec.setValue({ fieldId: 'custrecord_mst_accno_summaryinv', value: _d500Obj.accountno });

         insertD501(_d500Obj._d501List, summaryInvoiceRec);
         insertD505(_d500Obj._d505List, summaryInvoiceRec);
         insertD590(_d500Obj._d590List, summaryInvoiceRec);

         var summaryInvoiceId = summaryInvoiceRec.save();
      }

      function insertD501(_d501List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _d501List.length; index++) {
            var _d501Obj = _d501List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxsettcode_opcomp',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxident_opcomp',
               value: _d501Obj.taxIdent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_lineamount_opcomp',
               value: _d501Obj.lineamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_cstcode_opcomp',
               value: _d501Obj.piscstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_codenaturebasis_opcomp',
               value: _d501Obj.codeNatureBasis
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_basisamount_opcomp',
               value: _d501Obj.pisbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxpercent_opcomp',
               value: _d501Obj.pispercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxamount_opcomp',
               value: _d501Obj.pisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_accountno_opcomp',
               value: _d501Obj.accountno
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
         }
      }

      function insertD505(_d505List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _d505List.length; index++) {
            var _d505Obj = _d505List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxsettcode_opcomp',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxident_opcomp',
               value: _d505Obj.taxIdent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_lineamount_opcomp',
               value: _d505Obj.lineamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_cstcode_opcomp',
               value: _d505Obj.cofinscstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_codenaturebasis_opcomp',
               value: _d505Obj.codeNatureBasis
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_basisamount_opcomp',
               value: _d505Obj.cofinsbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxpercent_opcomp',
               value: _d505Obj.cofinspercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_taxamount_opcomp',
               value: _d505Obj.cofinsamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinv_opcomp',
               fieldId: 'custrecord_mts_accountno_opcomp',
               value: _d505Obj.accountno
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinv_opcomp' });
         }
      }

      function insertD590(_d590List, summaryInvoiceRec) {
         var taxSetId = summaryInvoiceRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_summaryinv' });

         for (var index = 0; index < _d590List.length; index++) {
            var _d590Obj = _d590List[index];

            summaryInvoiceRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc' });
            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_taxsettlement_analregdoc',
               value: taxSetId
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_cstcode_analregdoc',
               value: _d590Obj.cstcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_cfopcode_analregdoc',
               value: _d590Obj.cfopcode
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmspercent_analregdoc',
               value: _d590Obj.icmspercent
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_glamount_analregdoc',
               value: _d590Obj.glamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsbasis_analregdoc',
               value: _d590Obj.icmsbasisamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsamount_analregdoc',
               value: _d590Obj.icmsamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsexempt_analregdoc',
               value: _d590Obj.icmsexemptamount
            });

            summaryInvoiceRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc',
               fieldId: 'custrecord_mts_icmsothersamt_analregdoc',
               value: _d590Obj.icmsothersamount
            });

            summaryInvoiceRec.commitLine({ sublistId: 'recmachcustrecord_mts_summaryinvoice_analregdoc' });
         }
      }

      function insertD600(_d600List, taxSettlementRec) {

         for (var index = 0; index < _d600List.length; index++) {

            var _d600Obj = _d600List[index];

            var conservProvContRec = record.create({ type: 'customrecord_mts_conservprovcont', isDynamic: true });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_taxsettlm_conservprovcont', value: taxSettlementRec.id });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_revenuetp_conservprovcont', value: _d600Obj.revenueType });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_citibgecd_conservprovcont', value: _d600Obj.ibgecitycode });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_fiscmodcd_conservprovcont', value: _d600Obj.fiscalmodelcod });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_fisctype_conservprovcont', value: _d600Obj.fiscaltype });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_startdate_conservprovcont', value: _d600Obj.startDocDate ? new Date(_d600Obj.startDocDate) : '' });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_enddate_conservprovcont', value: _d600Obj.endDocDate ? new Date(_d600Obj.endDocDate) : '' });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_serie_conservprovcont', value: _d600Obj.seriesub });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_glamount_conservprovcont', value: _d600Obj.glamount });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_branchcode_conservprovcon', value: _d600Obj.branchCode });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_fiscdoctp_conservprovcont', value: _d600Obj.fiscaldoctype });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_percicms_conservprovcont', value: _d600Obj.icmsperc });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_icmsotham_conservprovcont', value: _d600Obj.icmsotheramount });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_icmsexpam_conservprovcont', value: _d600Obj.icmsexemptamount });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_icmsbasam_conservprovcont', value: _d600Obj.icmsbasisamount });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_icmsamoun_conservprovcont', value: _d600Obj.icmsamount });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_pisamount_conservprovcont', value: _d600Obj.pisamount });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_cofinsamt_conservprovcont', value: _d600Obj.cofinsamount });
            conservProvContRec.setValue({ fieldId: 'custrecord_mts_quantity_conservprovcont', value: _d600Obj.quantity });

            insertD601(_d600Obj._d601List, conservProvContRec);
            insertD605(_d600Obj._d605List, conservProvContRec);

            var conservProvContId = conservProvContRec.save();
         }
      }

      function insertD601(_d601List, conservProvContRec) {
         var taxSetId = conservProvContRec.getValue({ fieldId: 'custrecord_mts_taxsettlm_conservprovcont' });

         for (var index = 0; index < _d601List.length; index++) {
            var _d601Obj = _d601List[index];

            conservProvContRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp' });
            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_taxsettcode_opcomp',
               value: taxSetId
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_taxident_opcomp',
               value: _d601Obj.taxIdent
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_lineamount_opcomp',
               value: _d601Obj.lineamount
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_cstcode_opcomp',
               value: _d601Obj.piscstcode
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_codenaturebasis_opcomp',
               value: _d601Obj.codeNatureBasis
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_basisamount_opcomp',
               value: _d601Obj.pisbasisamount
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_taxpercent_opcomp',
               value: _d601Obj.pispercent
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_taxamount_opcomp',
               value: _d601Obj.pisamount
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_accountno_opcomp',
               value: _d601Obj.accountno
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_classitem_opcomp',
               value: _d601Obj.classItem
            });

            conservProvContRec.commitLine({ sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp' });
         }
      }

      function insertD605(_d605List, conservProvContRec) {
         var taxSetId = conservProvContRec.getValue({ fieldId: 'custrecord_mts_taxsettlm_conservprovcont' });

         for (var index = 0; index < _d605List.length; index++) {
            var _d605Obj = _d605List[index];

            conservProvContRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp' });
            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_taxsettcode_opcomp',
               value: taxSetId
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_taxident_opcomp',
               value: _d605Obj.taxIdent
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_lineamount_opcomp',
               value: _d605Obj.lineamount
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_cstcode_opcomp',
               value: _d605Obj.cofinscstcode
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_codenaturebasis_opcomp',
               value: _d605Obj.codeNatureBasis
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_basisamount_opcomp',
               value: _d605Obj.cofinsbasisamount
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_taxpercent_opcomp',
               value: _d605Obj.cofinspercent
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_taxamount_opcomp',
               value: _d605Obj.cofinsamount
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_accountno_opcomp',
               value: _d605Obj.accountno
            });

            conservProvContRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp',
               fieldId: 'custrecord_mts_classitem_opcomp',
               value: _d605Obj.classItem
            });

            conservProvContRec.commitLine({ sublistId: 'recmachcustrecord_mts_conservprovcont_opcomp' });
         }
      }

      function insertD695(_d695List, taxSettlementRec) {
         var datesToProcess = taxSettlementRec.getValue({fieldId: 'custrecord_mts_dtstoproc_taxsettlem_tmp'});
         var fileName = taxSettlementRec.getValue({fieldId: 'name'});
         fileName += '_D695List.json';

         if (datesToProcess){
            // se ainda existir datas para processar, salva as informações em um arquivo
            var d695AuxFile = file.create({
               name: fileName,
               contents: JSON.stringify(_d695List),
               folder: getFolderId(),
               fileType: file.Type.JSON
            });
            var d695AuxFileId = d695AuxFile.save();

            reserveAuxFileId('D695', d695AuxFileId, taxSettlementRec);
         }else{
            for (var index = 0; index < _d695List.length; index++) {
               var _d695Obj = _d695List[index];

               if (_d695Obj.mustBeCreated != undefined && _d695Obj.mustBeCreated != null && _d695Obj.mustBeCreated == false)
                  continue;

               var consolidationServiceProvRec = record.create({ type: 'customrecord_mts_conservprov', isDynamic: true });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_taxsettlement_conservprov', value: taxSettlementRec.id });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_fiscmodecode_conservprov', value: _d695Obj.fiscalmodelcod });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_fiscaltype_conservprov', value: _d695Obj.fiscaltype });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_series_conservprov', value: _d695Obj.seriesub });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_startdocno_conservprov', value: _d695Obj.startDocNo });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_enddocno_conservprov', value: _d695Obj.endDocNo });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_startdocdate_conservprov', value: _d695Obj.startDocDate ? new Date(_d695Obj.startDocDate) : '' });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_enddocdate_conservprov', value: _d695Obj.endDocDate ? new Date(_d695Obj.endDocDate) : '' });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_masterdigauth_conservprov', value: _d695Obj.masterDigitalAuthCode });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_filenamemaste_conservprov', value: _d695Obj.nomeMaster });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_taxsituation_conservprov', value: _d695Obj.taxsituation });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_glamount_conservprov', value: _d695Obj.glamount });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_icmsperc_conservprov', value: _d695Obj.icmsperc });
               consolidationServiceProvRec.setValue({ fieldId: 'custrecord_mts_cfop_conservprov', value: _d695Obj.cfopcode });

               insertD696(_d695Obj._d696List, consolidationServiceProvRec);

               var summaryInvoiceId = consolidationServiceProvRec.save();
            }

            // limpa o arquivo
            var d695AuxFile = file.create({
               name: fileName,
               contents: JSON.stringify([]),
               folder: getFolderId(),
               fileType: file.Type.JSON
            });
            var d695AuxFileId = d695AuxFile.save();

            reserveAuxFileId('D695', d695AuxFileId, taxSettlementRec);
         }
      }

      function insertD696(_d696List, consolidationServiceProvRec) {
         var taxSetId = consolidationServiceProvRec.getValue({ fieldId: 'custrecord_mts_taxsettlement_conservprov' });

         for (var index = 0; index < _d696List.length; index++) {
            var _d696Obj = _d696List[index];

            consolidationServiceProvRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_consservprov_analregdoc' });
            consolidationServiceProvRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_consservprov_analregdoc',
               fieldId: 'custrecord_mts_taxsettlement_analregdoc',
               value: taxSetId
            });

            consolidationServiceProvRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_consservprov_analregdoc',
               fieldId: 'custrecord_mts_cstcode_analregdoc',
               value: _d696Obj.cstcode
            });

            consolidationServiceProvRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_consservprov_analregdoc',
               fieldId: 'custrecord_mts_cfopcode_analregdoc',
               value: _d696Obj.cfopcode
            });

            consolidationServiceProvRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_consservprov_analregdoc',
               fieldId: 'custrecord_mts_icmspercent_analregdoc',
               value: _d696Obj.icmspercent
            });

            consolidationServiceProvRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_consservprov_analregdoc',
               fieldId: 'custrecord_mts_glamount_analregdoc',
               value: _d696Obj.glamount
            });

            consolidationServiceProvRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_consservprov_analregdoc',
               fieldId: 'custrecord_mts_icmsbasis_analregdoc',
               value: _d696Obj.icmsbasisamount
            });

            consolidationServiceProvRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_consservprov_analregdoc',
               fieldId: 'custrecord_mts_icmsamount_analregdoc',
               value: _d696Obj.icmsamount
            });

            consolidationServiceProvRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_consservprov_analregdoc',
               fieldId: 'custrecord_mts_icmsexempt_analregdoc',
               value: _d696Obj.icmsexemptamount
            });

            consolidationServiceProvRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_consservprov_analregdoc',
               fieldId: 'custrecord_mts_icmsothersamt_analregdoc',
               value: _d696Obj.icmsothersamount
            });

            consolidationServiceProvRec.commitLine({ sublistId: 'recmachcustrecord_mts_consservprov_analregdoc' });
         }
      }
      //---------------- FIM BLOCO D ----------------\\

      /* #endregion */


      /* #region  BLOCO E  */

      //---------------- INICIO BLOCO E -------------\\
      function insertE115(_e115List, taxSettlementRec) {
         for (var index = 0; index < _e115List.length; index++) {
            var _e115Obj = _e115List[index];

            if (_e115Obj.mustBeCreated != undefined && _e115Obj.mustBeCreated != null && _e115Obj.mustBeCreated == false)
               continue;

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxset_blocke115' });
            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxset_blocke115',
               fieldId: 'custrecord_mts_codinfadc_blocke115',
               value: _e115Obj.codinfadc
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxset_blocke115',
               fieldId: 'custrecord_mts_vlinfadic_blocke115',
               value: _e115Obj.vlinfadic.toFixed(2)
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxset_blocke115',
               fieldId: 'custrecord_mts_desccompaj_blocke115',
               value: _e115Obj.desccompaj
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxset_blocke115' });
         }
      }

      function insertE200(_e200List, taxSettlementRec) {
         for (var index = 0; index < _e200List.length; index++) {
            var _e200Obj = _e200List[index];

            if (_e200Obj.mustBeCreated != undefined && _e200Obj.mustBeCreated != null && _e200Obj.mustBeCreated == false)
               var altTaxPayerRec = record.load({ type: 'customrecord_mts_alttaxpayer', id: _e200Obj.id, isDynamic: true });
            else
               var altTaxPayerRec = record.create({ type: 'customrecord_mts_alttaxpayer', isDynamic: true });

            altTaxPayerRec.setValue({ fieldId: 'custrecord_mts_taxsettcode_alttaxpayer', value: taxSettlementRec.id });
            altTaxPayerRec.setValue({ fieldId: 'custrecord_mts_taxident_alttaxpayer', value: 15 });
            altTaxPayerRec.setValue({ fieldId: 'custrecord_mts_territory_alttaxpayer', value: _e200Obj.territoryCode });
            insertE210(_e200Obj._e210Obj, altTaxPayerRec);
            var altTaxPayerId = altTaxPayerRec.save();
         }
      }

      function insertE210(_e210Obj, altTaxPayerRec) {
         var taxSetId = altTaxPayerRec.getValue({ fieldId: 'custrecord_mts_taxsettcode_alttaxpayer' })
         var territoryCode = altTaxPayerRec.getValue({ fieldId: 'custrecord_mts_territory_alttaxpayer' })

         if (altTaxPayerRec.id)
            altTaxPayerRec.selectLine({ sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst', line: 0});   
         else
            altTaxPayerRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst' });
         
         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_taxsettlem_taxsettementst',
            value: taxSetId
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_territory_taxsettementst',
            value: territoryCode
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_indmovdifa_taxsettementst',
            value: _e210Obj.indMovDifal
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_credbalprev_taxsettements',
            value: ''
         });

         // log.debug({tilte: 'OnE210Inserting', details: _e210Obj.returnStAmount});
         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_retstamt_taxsettementst',
            value: _e210Obj.returnStAmount
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_compstamt_taxsettementst',
            value: _e210Obj.compensationStAmount
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_otherscred_taxsettementst',
            value: _e210Obj.icmsStOtherCredits
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_revdebicms_taxsettementst',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_totamtcred_taxsettementst',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_credicmsst_taxsettementst',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_retstmamt_taxsettementst',
            value: _e210Obj.retentionStAmount
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_icmsstdebi_taxsettementst',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_revcredst_taxsettementst',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_debitsicms_taxsettementst',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst',
            fieldId: 'custrecord_mts_deducicmsst_taxsettements',
            value: ''
         });

         altTaxPayerRec.commitLine({ sublistId: 'recmachcustrecord_mts_alttaxpaye_taxsettementst' });
      }

      function insertE300(_e300List, taxSettlementRec) {
         var datesToProcess = taxSettlementRec.getValue({fieldId: 'custrecord_mts_dtstoproc_taxsettlem_tmp'});
         var fileName = taxSettlementRec.getValue({fieldId: 'name'});
         fileName += '_E300List.json';

         if (datesToProcess){
            // se ainda existir datas para processar, salva as informações em um arquivo
            var e300AuxFile = file.create({
               name: fileName,
               contents: JSON.stringify(_e300List),
               folder: getFolderId(),
               fileType: file.Type.JSON
            });
            var e300AuxFileId = e300AuxFile.save();

            reserveAuxFileId('E300', e300AuxFileId, taxSettlementRec);
         }else{
            // se não existir datas para processar, ou seja, é o ultimo dia do processamento, salva as informações na tabela
            for (var index = 0; index < _e300List.length; index++) {
               var _e300Obj = _e300List[index];
   
               if (_e300Obj.mustBeCreated != undefined && _e300Obj.mustBeCreated != null && _e300Obj.mustBeCreated == false){
                  var altTaxPayerRec = record.load({ type: 'customrecord_mts_alttaxpayer', id: _e300Obj.id, isDynamic: true });
                  log.debug({title: 'onInsertE300', details: 'ByLoad'});
               }else{
                  var altTaxPayerRec = record.create({ type: 'customrecord_mts_alttaxpayer', isDynamic: true });
                  log.debug({title: 'onInsertE300', details: 'ByCreate'});
               }
               
               log.debug({title: 'onInsertE300', details: 'territoryCode: ' + _e300Obj.territoryCode});
               
               altTaxPayerRec.setValue({ fieldId: 'custrecord_mts_taxsettcode_alttaxpayer', value: taxSettlementRec.id });
               altTaxPayerRec.setValue({ fieldId: 'custrecord_mts_taxident_alttaxpayer', value: 14 });
               altTaxPayerRec.setValue({ fieldId: 'custrecord_mts_territory_alttaxpayer', value: _e300Obj.territoryCode });
               insertE310(_e300Obj._e310Obj, altTaxPayerRec);
               var altTaxPayerId = altTaxPayerRec.save();
               log.debug({title: 'onInsertE310', details: 'end-save'});
            }

            // limpa o arquivo
            var e300AuxFile = file.create({
               name: fileName,
               contents: JSON.stringify([]),
               folder: getFolderId(),
               fileType: file.Type.JSON
            });
            var e300AuxFileId = e300AuxFile.save();

            reserveAuxFileId('E300', e300AuxFileId, taxSettlementRec);
         }

         
      }

      function insertE310(_e310Obj, altTaxPayerRec) {
         var taxSetId = altTaxPayerRec.getValue({ fieldId: 'custrecord_mts_taxsettcode_alttaxpayer' })
         var territoryCode = altTaxPayerRec.getValue({ fieldId: 'custrecord_mts_territory_alttaxpayer' })

         if (altTaxPayerRec.id){
            altTaxPayerRec.selectLine({ sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia', line: 0 });
            log.debug({title: 'onInsertE310', details: 'selectLine'});
         }else{
            altTaxPayerRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia' });
            log.debug({title: 'onInsertE310', details: 'selectNewLine'});
         }

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_taxsettlement_tasedia',
            value: taxSetId
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_territorycode_tasedia',
            value: territoryCode
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_indmovdifal_tasedia',
            value: _e310Obj.indMovDifal
         });

         // debit amounts
         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_debamtfcpemit_tasedia_tmp',
            value: _e310Obj.amountDebitFcpEmit
         });
         
         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_debamtfcprem_tasedia_tmp',
            value: _e310Obj.amountDebitFcpRem
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_icmsdifdeb_tasedia',
            value: _e310Obj.amountDebitFcpEmit > 0 ? _e310Obj.amountDebitFcpEmit : _e310Obj.amountDebitFcpRem
         });
         log.debug({title: 'onInsertE310', details: 'amountDebitFcpEmit: ' + _e310Obj.amountDebitFcpEmit});
         log.debug({title: 'onInsertE310', details: 'amountDebitFcpRem: ' + _e310Obj.amountDebitFcpRem});
         

         // credit amounts
         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_crdamtfcpemit_tasedia_tmp',
            value: _e310Obj.amountCreditFcpEmit
         });
         
         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_crdamtfcprem_tasedia_tmp',
            value: _e310Obj.amountCreditFcpRem
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_icmsdifcred_tasedia',
            value: _e310Obj.amountCreditFcpEmit > 0 ? _e310Obj.amountCreditFcpEmit : _e310Obj.amountCreditFcpRem
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_vltotcredfcp_tasedia',
            value: _e310Obj.amountCreditFCP
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_vltotdebfcp_tasedia',
            value: _e310Obj.amountDebitFCP
         });


         var totalSum = (_e310Obj.amountDebitFcpEmit + _e310Obj.amountDebitFcpRem) - (_e310Obj.amountCreditFcpEmit + _e310Obj.amountCreditFcpRem);

         if (totalSum >= 0) {

            altTaxPayerRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
               fieldId: 'custrecord_mts_subtoticmsd_tasedia',
               value: totalSum
            });

            altTaxPayerRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
               fieldId: 'custrecord_mts_collectamount_tasedia',
               value: totalSum
            });

         } else {

            altTaxPayerRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
               fieldId: 'custrecord_mts_credamttrans_tasedia',
               value: Math.abs(totalSum)
            });

         }


         var totalSum = _e310Obj.amountDebitFCP - _e310Obj.amountCreditFCP;

         if (totalSum >= 0) {

            altTaxPayerRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
               fieldId: 'custrecord_mts_subtotalfcp_tasedia',
               value: totalSum
            });

            altTaxPayerRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
               fieldId: 'custrecord_mts_colamtfcp_tasedia',
               value: totalSum
            });

         } else {

            altTaxPayerRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
               fieldId: 'custrecord_mts_credamtfcpt_tasedia',
               value: Math.abs(totalSum)
            });

         }

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_icmsdcp_tasedia',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_oneothdeb_tasedia',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_twoothdred_tasedia',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_threededuc_tasedia',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_fourespdebamt_tasedia',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_credprevfcp_tasedia',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_oneothdebfcp_tasedia',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_twoothdcredfcp_tasedia',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_threededucfcp_tasedia',
            value: ''
         });

         altTaxPayerRec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia',
            fieldId: 'custrecord_mts_espdebamt_tasedia',
            value: ''
         });

         altTaxPayerRec.commitLine({ sublistId: 'recmachcustrecord_mts_alternatetaxpayer_tasedia' });
         log.debug({title: 'onInsertE310', details: 'end'});
      }

      function insertE510(_e510List, taxSettlementRec) {
         for (var index = 0; index < _e510List.length; index++) {
            var _e510Obj = _e510List[index];

            if (_e510Obj.mustBeCreated != undefined && _e510Obj.mustBeCreated != null && _e510Obj.mustBeCreated == false)
               taxSettlementRec.selectLine({ sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt', line: _e510Obj.line });
            else
               taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt' });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
               fieldId: 'custrecord_mts_cfopcode_taxconsamt',
               value: _e510Obj.cfopCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
               fieldId: 'custrecord_mts_cstcode_taxconsamt',
               value: _e510Obj.cstCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
               fieldId: 'custrecord_mts_glamount_taxconsamt',
               value: _e510Obj.glamount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
               fieldId: 'custrecord_mts_ipibasisamt_taxconsamt',
               value: _e510Obj.IPIBasisAmount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
               fieldId: 'custrecord_mts_ipiamount_taxconsamt',
               value: _e510Obj.IPIamount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
               fieldId: 'custrecord_mts_ipiexemptamt_taxconsamt',
               value: _e510Obj.IPIexemptBasisAmount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
               fieldId: 'custrecord_mts_ipiothersamt_taxconsamt',
               value: _e510Obj.IPIotherBasisAmount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt',
               fieldId: 'custrecord_mts_fiscaltype_taxconsamt',
               value: _e510Obj.fiscalType
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettlement_taxconsamt' });
         }
      }

      //---------------- FIM BLOCO E ----------------\\

      /* #endregion */


      /* #region  BLOCO F  */

      //---------------- INICIO BLOCO F -------------\\
      function insertF100(_f100List, taxSettlementRec) {

         for (var index = 0; index < _f100List.length; index++) {
            var _f100bj = _f100List[index];

            var f100Rec = record.create({ type: 'customrecord_mts_f100otherdocuments' });

            // taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettlement_f100' });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_taxsettlement_f100',
               value: taxSettlementRec.id
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_codpart_f100',
               value: _f100bj.entity
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_coditem_f100',
               value: _f100bj.itemId
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_dtoper_f100',
               value: new Date(_f100bj.docDate)
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_vloper_f100',
               value: _f100bj.lineamount
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_piscstcode_f100',
               value: _f100bj.piscstcode
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_vlbcpis_f100',
               value: _f100bj.pisbasisamount
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_aliqpis_f100',
               value: _f100bj.pispercent
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_vlpis_f100',
               value: _f100bj.pisamount
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_cofinscstcode_f100',
               value: _f100bj.cofinscstcode
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_vlbccofins_f100',
               value: _f100bj.cofinsbasisamount
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_vlcofins_f100',
               value: _f100bj.cofinsamount
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_aliqcofins_f100',
               value: _f100bj.cofinspercent
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_natbccred_f100',
               value: _f100bj.codeNatureBasis
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_indorigcred_f100',
               value: _f100bj.creditSource
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_codcta_f100',
               value: _f100bj.accountno
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_indoperf100_f100',
               value: _f100bj.indOper
            });

            f100Rec.setValue({
               fieldId: 'custrecord_mts_branchcode_f100',
               value: _f100bj.branchCode || ''
            });

            var f100Id = f100Rec.save();

            // taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettlement_f100' });
         }
      }

      function insertF500(_f500List, taxSettlementRec) {

         for (var index = 0; index < _f500List.length; index++) {
            var _f500Obj = _f500List[index];

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsett_f500' });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f500',
               fieldId: 'custrecord_mts_branchcode_f500',
               value: _f500Obj.branchCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f500',
               fieldId: 'custrecord_mts_piscst_f500',
               value: _f500Obj.pisCstCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f500',
               fieldId: 'custrecord_mts_cofinscst_f500',
               value: _f500Obj.cofinsCstCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f500',
               fieldId: 'custrecord_mts_vlreccaixa_f500',
               value: _f500Obj.VL_REC_CAIXA
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f500',
               fieldId: 'custrecord_mts_pisaliq_f500',
               value: _f500Obj.ALIQ_PIS
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f500',
               fieldId: 'custrecord_mts_vlbspis_f500',
               value: _f500Obj.VL_BC_PIS
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f500',
               fieldId: 'custrecord_mts_vlpis_f500',
               value: _f500Obj.VL_PIS
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f500',
               fieldId: 'custrecord_mts_cofinsaliq_f500',
               value: _f500Obj.ALIQ_COFINS
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f500',
               fieldId: 'custrecord_mts_vlbccofins_f500',
               value: _f500Obj.VL_BC_COFINS
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f500',
               fieldId: 'custrecord_mts_vlcofins_f500',
               value: _f500Obj.VL_COFINS
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsett_f500' });
         }
      }

      function insertF525(_f525List, taxSettlementRec) {

         for (var index = 0; index < _f525List.length; index++) {
            var _f525Obj = _f525List[index];

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsett_f525' });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f525',
               fieldId: 'custrecord_mts_branchcode_f525',
               value: _f525Obj.branchCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f525',
               fieldId: 'custrecord_mts_piscst_f525',
               value: _f525Obj.pisCstCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f525',
               fieldId: 'custrecord_mts_cofinscst_f525',
               value: _f525Obj.cofinsCstCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f525',
               fieldId: 'custrecord_mts_vlrec_f525',
               value: _f525Obj.VL_REC
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f525',
               fieldId: 'custrecord_mts_vlrecdet_f525',
               value: _f525Obj.VL_REC_DET
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f525',
               fieldId: 'custrecord_mts_indrec_f525',
               value: _f525Obj.IND_REC
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_f525',
               fieldId: 'custrecord_mts_cpfcnpj_f525',
               value: _f525Obj.cpfCnpj
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsett_f525' });
         }
      }

      function insertF600(_f600List, taxSettlementRec) {
         for (var index = 0; index < _f600List.length; index++) {
            var _f600bj = _f600List[index];

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettlements_f600' });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_indnatret_f600',
               value: _f600bj.natureRetentionSource
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_dtret_f600',
               value: _f600bj.endDate ? new Date(_f600bj.endDate) : ''
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_vlbcret_f600',
               value: _f600bj.totalBase
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_vlret_f600',
               value: _f600bj.totalAmount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_codrec_f600',
               value: _f600bj.retentionCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_indnatrec_f600',
               value: _f600bj.indNatRec
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_cnpj_f600',
               value: _f600bj.cpfCnpj
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_vlretpis_f600',
               value: _f600bj.pisRetAmount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_vlretcofins_f600',
               value: _f600bj.cofinsRetAmount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_inddec_f600',
               value: 0
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettlements_f600',
               fieldId: 'custrecord_mts_branch_f600',
               value: _f600bj.branchCode
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettlements_f600' });
         }
      }

      //---------------- FIM BLOCO F ----------------\\

      /* #endregion */

      
      /* #region  BLOCO G  */

      //---------------- INICIO BLOCO G -------------\\
      function insertG110(_g110Obj, taxSettlementRec) {
         if (Object.keys(_g110Obj).length) {

            var abstractValuesCiapRec = record.create({ type: 'customrecord_mts_absvciap', isDynamic: true });
            abstractValuesCiapRec.setValue({ fieldId: 'custrecord_mts_taxsettcode_absvciap', value: taxSettlementRec.id });

            abstractValuesCiapRec.setValue({ fieldId: 'custrecord_mts_begicmsbal_absvciap', value: _g110Obj.totalBeginICMSBalance });
            abstractValuesCiapRec.setValue({ fieldId: 'custrecord_mts_icmssump_absvciap', value: _g110Obj.totalAmountICMSPlot });
            abstractValuesCiapRec.setValue({ fieldId: 'custrecord_mts_expvltrib_absvciap', value: _g110Obj.exportValueTributed });
            abstractValuesCiapRec.setValue({ fieldId: 'custrecord_mts_amounttotal_absvciap', value: _g110Obj.amountTotal });
            abstractValuesCiapRec.setValue({ fieldId: 'custrecord_mts_credothperiods_absvciap', value: _g110Obj.creditOtherPeriods });

            abstractValuesCiapRec.save();

            insertG125(_g110Obj._g125List, abstractValuesCiapRec);
         }
      }

      function insertG125(_g125List, abstractValuesCiapRec) {
         var taxSetId = abstractValuesCiapRec.getValue({ fieldId: 'custrecord_mts_taxsettcode_absvciap' });

         for (var index = 0; index < _g125List.length; index++) {
            var _g125Obj = _g125List[index];

            var _g125Rec = record.create({ type: 'customrecord_mts_fiascrap', isDynamic: true });
            _g125Rec.setValue({ fieldId: 'custrecord_mts_taxsettcode_fiascrap', value: taxSetId });

            _g125Rec.setValue({ fieldId: 'custrecord_mts_fixasscode_fiascrap', value: _g125Obj.fixedAssetId });
            _g125Rec.setValue({ fieldId: 'custrecord_mts_datemov_fiascrap', value: _g125Obj.dateMov ? new Date(_g125Obj.dateMov) : '' });
            _g125Rec.setValue({ fieldId: 'custrecord_mts_typemov_fiascrap', value: _g125Obj.typeMov });
            _g125Rec.setValue({ fieldId: 'custrecord_mts_amtimicms_fiascrap', value: _g125Obj.amountICMS });
            _g125Rec.setValue({ fieldId: 'custrecord_mts_amticmsst_fiascrap', value: _g125Obj.amountST });
            _g125Rec.setValue({ fieldId: 'custrecord_mts_amticmsfght_fiascrap', value: _g125Obj.amountFRt });
            _g125Rec.setValue({ fieldId: 'custrecord_mts_amticmsdff_fiascrap', value: _g125Obj.amountDifICMS });
            _g125Rec.setValue({ fieldId: 'custrecord_mts_plotnumber_fiascrap', value: _g125Obj.numParc });
            _g125Rec.setValue({ fieldId: 'custrecord_icmspltamt_fiascrap', value: _g125Obj.amountParc });

            // insertG126(_g125Obj._g126List, _g125Rec);

            _g125Rec.save();

            insertG130(_g125Obj._g130Obj, _g125Rec);
         }
      }

      function insertG126(_g126List, _g125Rec) {
         for (var index = 0; index < _g126List.length; index++) {
            var _g126Obj = _g126List[index];

            _g125Rec.selectNewLine({ sublistId: 'recmachcustrecord_mts_fixedassetcredit_otcrciap' });
            _g125Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_fixedassetcredit_otcrciap',
               fieldId: 'custrecord_mts_intcalcdate_otcrciap',
               value: _g126Obj.fieldA
            });

            _g125Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_fixedassetcredit_otcrciap',
               fieldId: 'custrecord_mts_fnlcalcdate_otcrciap',
               value: _g126Obj.fieldB
            });

            _g125Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_fixedassetcredit_otcrciap',
               fieldId: 'custrecord_mts_plotnumber_otcrciap',
               value: _g126Obj.fieldA
            });

            _g125Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_fixedassetcredit_otcrciap',
               fieldId: 'custrecord_mts_amountplot_otcrciap',
               value: _g126Obj.fieldA
            });

            _g125Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_fixedassetcredit_otcrciap',
               fieldId: 'custrecord_mts_taxrtaout_otcrciap',
               value: _g126Obj.fieldA
            });

            _g125Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_fixedassetcredit_otcrciap',
               fieldId: 'custrecord_mts_amountotal_otcrciap',
               value: _g126Obj.fieldA
            });

            _g125Rec.commitLine({ sublistId: 'recmachcustrecord_mts_fixedassetcredit_otcrciap' });
         }
      }

      function insertG130(_g130Obj, _g125Rec) {
         var taxSetId = _g125Rec.getValue({ fieldId: 'custrecord_mts_taxsettcode_fiascrap' });

         if (Object.keys(_g130Obj).length) {
            var _g130Rec = record.create({ type: 'customrecord_mts_taiddcciap', isDynamic: true });
            _g130Rec.setValue({ fieldId: 'custrecord_mts_taxsettcode_taiddcciap', value: taxSetId });
            _g130Rec.setValue({ fieldId: 'custrecord_mts_fixassecredap_taiddcciap', value: _g125Rec.id });

            _g130Rec.setValue({ fieldId: 'custrecord_mts_issind_taiddcciap', value: _g130Obj.issuerIndication });
            _g130Rec.setValue({ fieldId: 'custrecord_mts_partcode_taiddcciap', value: _g130Obj.participantCode });
            _g130Rec.setValue({ fieldId: 'custrecord_mts_fiscdocmodel_taiddcciap', value: _g130Obj.fiscalDocModel });
            _g130Rec.setValue({ fieldId: 'custrecord_mts_series_taiddcciap', value: _g130Obj.series });
            _g130Rec.setValue({ fieldId: 'custrecord_mts_invoiceno_taiddcciap', value: _g130Obj.invoiceNo });
            _g130Rec.setValue({ fieldId: 'custrecord_mts_einvoicekey_taiddcciap', value: _g130Obj.eInvoiceKey });
            _g130Rec.setValue({ fieldId: 'custrecord_mts_documentdate_taiddcciap', value: _g130Obj.documentDate ? new Date(_g130Obj.documentDate) : '' });
            _g130Rec.setValue({ fieldId: 'custrecord_mts_statecollecdoc_taiddcciap', value: _g130Obj.stateCollection });

            insertG140(_g130Obj._g140Obj, _g130Rec);

            _g130Rec.save();
         }
      }

      function insertG140(_g140Obj, _g130Rec) {
         var taxSetId = _g130Rec.getValue({ fieldId: 'custrecord_mts_taxsettcode_taiddcciap' });

         if (Object.keys(_g140Obj).length) {
            _g130Rec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident' });
            _g130Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident',
               fieldId: 'custrecord_mts_taxsett_taxdocitemident',
               value: taxSetId
            });

            _g130Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident',
               fieldId: 'custrecord_mts_seqno_taxdocitemident',
               value: _g140Obj.sequencialNo
            });

            _g130Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident',
               fieldId: 'custrecord_mts_code_taxdocitemident',
               value: _g140Obj.item
            });

            _g130Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident',
               fieldId: 'custrecord_mts_fixassetc_taxdocitemident',
               value: ''
            });

            _g130Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident',
               fieldId: 'custrecord_mts_quantity_taxdocitemident',
               value: _g140Obj.quantity
            });

            _g130Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident',
               fieldId: 'custrecord_mts_unit_taxdocitemident',
               value: _g140Obj.unit
            });

            _g130Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident',
               fieldId: 'custrecord_mts_amounicms_taxdocitemident',
               value: _g140Obj.amountIcms
            });

            _g130Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident',
               fieldId: 'custrecord_mts_sttotam_taxdocitemident',
               value: _g140Obj.amountSt
            });

            _g130Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident',
               fieldId: 'custrecord_mts_amountfre_taxdocitemident',
               value: _g140Obj.amountFreight
            });

            _g130Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident',
               fieldId: 'custrecord_mts_difamount_taxdocitemident',
               value: _g140Obj.amountDifIcms
            });

            _g130Rec.commitLine({ sublistId: 'recmachcustrecord_mts_taxdociap_taxdocitemident' });
         }
      }
      //---------------- FIM BLOCO G ----------------\\

      /* #endregion */


      /* #region  BLOCO H  */

      //---------------- INICIO BLOCO H -------------\\
      function insertH005(_h005Obj, taxSettlementRec) {
         var invTotalRec = record.create({ type: 'customrecord_mts_invtotal', isDynamic: true });
         invTotalRec.setValue({ fieldId: 'custrecord_mts_taxsett_invtotal', value: taxSettlementRec.id });

         invTotalRec.setValue({ fieldId: 'custrecord_mts_inventorydate_invtotal', value: _h005Obj.inventoryDate ? new Date(_h005Obj.inventoryDate) : '' });
         invTotalRec.setValue({ fieldId: 'custrecord_mts_invtotal_invtotal', value: _h005Obj.inventoryTotal });
         invTotalRec.setValue({ fieldId: 'custrecord_mts_inventoryreason_invtotal', value: _h005Obj.inventoryReason });

         insertH010(_h005Obj._h010List, invTotalRec);

         invTotalRec.save();
      }

      function insertH010(_h010List, invTotalRec) {
         var taxSetId = invTotalRec.getValue({ fieldId: 'custrecord_mts_taxsett_invtotal' });

         for (var index = 0; index < _h010List.length; index++) {
            var _h010Obj = _h010List[index];

            invTotalRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_invtotal_inventory' });
            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_taxsettlcode_inventory',
               value: taxSetId
            });

            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_no_inventory',
               value: _h010Obj.item
            });

            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_unitcode_inventory',
               value: _h010Obj.unitCode
            });

            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_quantity_inventory',
               value: _h010Obj.quantity
            });

            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_unitamount_inventory',
               value: (_h010Obj.amount / _h010Obj.quantity).toFixed(2)
            });

            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_amount_inventory',
               value: _h010Obj.amount
            });

            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_propertytype_inventory',
               value: _h010Obj.locationType
            });

            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_custvendcode_inventory',
               value: _h010Obj.entityId ? _h010Obj.entityId : ''
            });

            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_compdesc_inventory',
               value: ''
            });

            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_accountno_inventory',
               value: _h010Obj.account
            });

            invTotalRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_invtotal_inventory',
               fieldId: 'custrecord_mts_ir_item_amount',
               value: _h010Obj.amount
            });

            invTotalRec.commitLine({ sublistId: 'recmachcustrecord_mts_invtotal_inventory' });
         }
      }
      //---------------- FIM BLOCO H ----------------\\

      /* #endregion */


      /* #region  BLOCO I  */

      //---------------- INICIO BLOCO I -------------\\


      //---------------- FIM BLOCO I ----------------\\

      /* #endregion */


      /* #region  BLOCO K  */

      //---------------- INICIO BLOCO K -------------\\
      function insertK200(_k200List, taxSettlementRec) {
         for (var index = 0; index < _k200List.length; index++) {
            var _k200Obj = _k200List[index];

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettcode_inventblockk' });
            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcode_inventblockk',
               fieldId: 'custrecord_mts_no_inventblockk',
               value: _k200Obj.item
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcode_inventblockk',
               fieldId: 'custrecord_mts_quantity_inventblockk',
               value: _k200Obj.quantity
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcode_inventblockk',
               fieldId: 'custrecord_mts_propertytype_inventblockk',
               value: _k200Obj.locationType
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsettcode_inventblockk',
               fieldId: 'custrecord_mts_custvendcode_inventblockk',
               value: _k200Obj.entityId ? _k200Obj.entityId : ''
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettcode_inventblockk' });
         }
      }

      // function insertK210 (_k210List, taxSettlementRec) {
      //     for (var index = 0; index < _k210List.length; index++) {
      //         var _k210Obj = _k210List[index];

      //         var prodblockk210Rec = record.create({ type: 'customrecord_mts_prodblockk210' });
      //         prodblockk210Rec.setValue({ fieldId: 'taxsettid', value: taxSettlementRec.id });

      //         prodblockk210Rec.setValue({ fieldId: 'custrecord_mts_startdate_prodblockk210', value: _k210Obj.fieldB });
      //         prodblockk210Rec.setValue({ fieldId: 'custrecord_mts_prodorderno_prodblockk210', value: _k210Obj.fieldB });
      //         prodblockk210Rec.setValue({ fieldId: 'custrecord_mts_itemno_prodblockk210', value: _k210Obj.fieldB });
      //         prodblockk210Rec.setValue({ fieldId: 'custrecord_mts_quantity_prodblockk210', value: _k210Obj.fieldB });

      //         insertK215(_k210Obj._k215List, prodblockk210Rec);

      //         prodblockk210Rec.save();
      //     }
      // }

      // function insertK220 (_K220List, taxSettlementRec) {
      //     for (var index = 0; index < _K220List.length; index++) {
      //         var _k220Obj = _K220List[index];

      //         taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettlem_othmovk220' });
      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettlem_othmovk220',
      //             fieldId: 'custrecord_mts_postdate_othmovk220',
      //             value: _k220Obj.fieldA
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettlem_othmovk220',
      //             fieldId: 'custrecord_mts_noitemorigin_othmovk220',
      //             value: _k220Obj.fieldB
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettlem_othmovk220',
      //             fieldId: 'custrecord_mts_noitemdestiny_othmovk220',
      //             value: _k220Obj.fieldB
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettlem_othmovk220',
      //             fieldId: 'custrecord_mts_quantity_othmovk220',
      //             value: _k220Obj.fieldB
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettlem_othmovk220',
      //             fieldId: 'custrecord_mts_postdate_othmovk220',
      //             value: _k220Obj.fieldB
      //         });

      //         taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettlem_othmovk220' });
      //     }
      // }

      // function insertK230 (_k230List, taxSettlementRec) {
      //     for (var index = 0; index < _k230List.length; index++) {
      //         var _k230Obj = _k230List[index];

      //         var producblockk230Rec = record.create({ type: 'customrecord_mts_producblockk230' });
      //         producblockk230Rec.setValue({ fieldId: 'taxsettid', value: taxSettlementRec.id });

      //         producblockk230Rec.setValue({ fieldId: 'custrecord_mts_startdate_producblockk230', value: _k230Obj.fieldB });
      //         producblockk230Rec.setValue({ fieldId: 'custrecord_mts_enddate_producblockk230', value: _k230Obj.fieldB });
      //         producblockk230Rec.setValue({ fieldId: 'custrecord_mts_prodorder_producblockk230', value: _k230Obj.fieldB });
      //         producblockk230Rec.setValue({ fieldId: 'custrecord_mts_itemno_producblockk230', value: _k230Obj.fieldB });
      //         producblockk230Rec.setValue({ fieldId: 'custrecord_mts_quantity_producblockk230', value: _k230Obj.fieldB });

      //         insertK235(_k230Obj._k235List, producblockk230Rec);

      //         producblockk230Rec.save();
      //     }
      // }

      // function insertK250 (_k250List, taxSettlementRec) {
      //     for (var index = 0; index < _k250List.length; index++) {
      //         var _k250Obj = _k250List[index];

      //         var manblockk250Rec = record.create({ type: 'customrecord_mts_manblockk250' });
      //         manblockk250Rec.setValue({ fieldId: 'taxsettid', value: taxSettlementRec.id });

      //         manblockk250Rec.setValue({ fieldId: 'custrecord_mts_enddate_manblockk250', value: _k250Obj.fieldB });
      //         manblockk250Rec.setValue({ fieldId: 'custrecord_mts_itemno_manblockk250', value: _k250Obj.fieldB });
      //         manblockk250Rec.setValue({ fieldId: 'custrecord_mts_quantity_manblockk250', value: _k250Obj.fieldB });

      //         insertK255(_k250Obj._k255List, manblockk250Rec);

      //         manblockk250Rec.save();
      //     }
      // }

      // function insertK260 (_k260List, taxSettlementRec) {
      //     for (var index = 0; index < _k260List.length; index++) {
      //         var _k260Obj = _k260List[index];

      //         var reprocessproductk260Rec = record.create({ type: 'customrecord_mts_reprocessproductk260' });
      //         reprocessproductk260Rec.setValue({ fieldId: 'taxsettid', value: taxSettlementRec.id });

      //         reprocessproductk260Rec.setValue({ fieldId: 'custrecord_mts_prodorderno_repprodk260', value: _k260Obj.fieldB });
      //         reprocessproductk260Rec.setValue({ fieldId: 'custrecord_mts_orderno_repprodk260', value: _k260Obj.fieldB });
      //         reprocessproductk260Rec.setValue({ fieldId: 'custrecord_mts_outputdate_repprodk260', value: _k260Obj.fieldB });
      //         reprocessproductk260Rec.setValue({ fieldId: 'custrecord_mts_outputquant_repprodk260', value: _k260Obj.fieldB });
      //         reprocessproductk260Rec.setValue({ fieldId: 'custrecord_mts_inputdate_repprodk260', value: _k260Obj.fieldB });
      //         reprocessproductk260Rec.setValue({ fieldId: 'custrecord_mts_inputquant_repprodk260', value: _k260Obj.fieldB });

      //         insertK265(_k260Obj._k265List, reprocessproductk260Rec);

      //         reprocessproductk260Rec.save();
      //     }
      // }

      // function insertK280 (_K280List, taxSettlementRec) {
      //     for (var index = 0; index < _K280List.length; index++) {
      //         var _k280Obj = _K280List[index];

      //         taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettcode_crpoblk280' });
      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettcode_crpoblk280',
      //             fieldId: 'custrecord_mts_dtsckspedptb_crpoblk280',
      //             value: _k280Obj.fieldA
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettcode_crpoblk280',
      //             fieldId: 'custrecord_mts_itemno_crpoblk280',
      //             value: _k280Obj.fieldB
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettcode_crpoblk280',
      //             fieldId: 'custrecord_mts_positqty_crpoblk280',
      //             value: _k280Obj.fieldB
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettcode_crpoblk280',
      //             fieldId: 'custrecord_mts_negqty_crpoblk280',
      //             value: _k280Obj.fieldB
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettcode_crpoblk280',
      //             fieldId: 'custrecord_mts_proptysped_crpoblk280',
      //             value: _k280Obj.fieldB
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettcode_crpoblk280',
      //             fieldId: 'custrecord_mts_codeapedcust_crpoblk280',
      //             value: _k280Obj.fieldB
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettcode_crpoblk280',
      //             fieldId: 'custrecord_mts_codeapedvend_crpoblk280',
      //             value: _k280Obj.fieldB
      //         });

      //         taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettcode_crpoblk280' });
      //     }
      // }




      // function insertK215 (_k215List, prodblockk210Rec) {
      //     for (var index = 0; index < _k215List.length; index++) {
      //         var _k215Obj = _k215List[index];

      //         prodblockk210Rec.selectNewLine({ sublistId: 'recmachcustrecord_mts_prodblok210_prodblockk215' });
      //         prodblockk210Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_prodblok210_prodblockk215',
      //             fieldId: 'custrecord_mts_quantity_prodblockk215',
      //             value: _k215Obj.fieldA
      //         });

      //         prodblockk210Rec.commitLine({ sublistId: 'recmachcustrecord_mts_prodblok210_prodblockk215' });
      //     }
      // }

      // function insertK235 (_k235List, producblockk230Rec) {
      //     for (var index = 0; index < _k235List.length; index++) {
      //         var _k235Obj = _k235List[index];

      //         producblockk230Rec.selectNewLine({ sublistId: 'recmachcustrecord_mts_proiteblk230_consblock235' });
      //         producblockk230Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_proiteblk230_consblock235',
      //             fieldId: 'custrecord_mts_postdate_consblock235',
      //             value: _k235Obj.fieldA
      //         });

      //         producblockk230Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_proiteblk230_consblock235',
      //             fieldId: 'custrecord_mts_itemno_consblock235',
      //             value: _k235Obj.fieldB
      //         });

      //         producblockk230Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_proiteblk230_consblock235',
      //             fieldId: 'custrecord_mts_quantity_consblock235',
      //             value: _k235Obj.fieldB
      //         });

      //         producblockk230Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_proiteblk230_consblock235',
      //             fieldId: 'custrecord_mts_substititem_consblock235',
      //             value: _k235Obj.fieldB
      //         });

      //         producblockk230Rec.commitLine({ sublistId: 'recmachcustrecord_mts_proiteblk230_consblock235' });
      //     }
      // }

      // function insertK255 (_k255List, manblockk250Rec) {
      //     for (var index = 0; index < _k255List.length; index++) {
      //         var _k255Obj = _k255List[index];

      //         manblockk250Rec.selectNewLine({ sublistId: 'recmachcustrecord_mts_manblockk250_manblockk255' });
      //         manblockk250Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_manblockk250_manblockk255',
      //             fieldId: 'custrecord_mts_postdate_manblockk255',
      //             value: _k255Obj.fieldA
      //         });

      //         manblockk250Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_manblockk250_manblockk255',
      //             fieldId: 'custrecord_mts_itemno_manblockk255',
      //             value: _k255Obj.fieldB
      //         });

      //         manblockk250Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_manblockk250_manblockk255',
      //             fieldId: 'custrecord_mts_quantity_manblockk255',
      //             value: _k255Obj.fieldB
      //         });

      //         manblockk250Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_manblockk250_manblockk255',
      //             fieldId: 'custrecord_mts_substituitem_manblockk255',
      //             value: _k255Obj.fieldB
      //         });

      //         manblockk250Rec.commitLine({ sublistId: 'recmachcustrecord_mts_manblockk250_manblockk255' });
      //     }
      // }

      // function insertK265 (_k265List, reprocessproductk260Rec) {
      //     for (var index = 0; index < _k265List.length; index++) {
      //         var _k265Obj = _k265List[index];

      //         reprocessproductk260Rec.selectNewLine({ sublistId: 'recmachcustrecord_mts_repprodk260_repprodk265' });
      //         reprocessproductk260Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_repprodk260_repprodk265',
      //             fieldId: 'custrecord_mts_itemno_repprodk265',
      //             value: _k265Obj.fieldA
      //         });

      //         reprocessproductk260Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_repprodk260_repprodk265',
      //             fieldId: 'custrecord_mts_outputquant_repprodk265',
      //             value: _k265Obj.fieldB
      //         });

      //         reprocessproductk260Rec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_repprodk260_repprodk265',
      //             fieldId: 'custrecord_mts_inputquant_repprodk265',
      //             value: _k265Obj.fieldB
      //         });

      //         reprocessproductk260Rec.commitLine({ sublistId: 'recmachcustrecord_mts_repprodk260_repprodk265' });
      //     }
      // }
      //---------------- FIM BLOCO K ----------------\\

      /* #endregion */


      /* #region  BLOCO M  */

      //---------------- INICIO BLOCO M -------------\\
      function insertM200(_M200List, taxSettlementRec) {

         for (var index = 0; index < _M200List.length; index++) {
            var _M200bj = _M200List[index];

            var _M200Rec = record.create({ type: 'customrecord_mts_spedpcbckm', isDynamic: true });
            _M200Rec.setValue({ fieldId: 'custrecord_mts_no_spedpcbckm', value: taxSettlementRec.id });

            _M200Rec.setValue({ fieldId: 'custrecord_mts_blockcode_spedpcbckm', value: 'M200' });
            _M200Rec.setValue({ fieldId: 'custrecord_mts_vlretnc_spedpcbckm', value: _M200bj.VL_RET_NC });
            _M200Rec.setValue({ fieldId: 'custrecord_mts_vlretcum_spedpcbckm', value: _M200bj.VL_RET_CUM });
            _M200Rec.setValue({ fieldId: 'custrecord_mts_vltccumper_spedpcbckm', value: _M200bj.VL_TOT_CONT_CUM_PER });
            _M200Rec.setValue({ fieldId: 'custrecord_mts_vlcontcumrec_spedpcbckm', value: _M200bj.VL_CONT_CUM_REC });
            _M200Rec.setValue({ fieldId: 'custrecord_mts_vltotcontrec_spedpcbckm', value: _M200bj.VL_TOT_CONT_REC });

            _M200Rec.save();
         }
      }

      function insertM400(_M400List, taxSettlementRec) {

         for (var index = 0; index < _M400List.length; index++) {
            var _M400bj = _M400List[index];

            var _M400Rec = record.create({ type: 'customrecord_mts_spedpcbckm', isDynamic: true });
            _M400Rec.setValue({ fieldId: 'custrecord_mts_no_spedpcbckm', value: taxSettlementRec.id });

            _M400Rec.setValue({ fieldId: 'custrecord_mts_blockcode_spedpcbckm', value: 'M400' });
            _M400Rec.setValue({ fieldId: 'custrecord_mts_branchcode_spedpcbckm', value: _M400bj.branchCode });
            _M400Rec.setValue({ fieldId: 'custrecord_mts_vltotrec_spedpcbckm', value: _M400bj.VL_TOT_REC });
            _M400Rec.setValue({ fieldId: 'custrecord_mts_cstpis_spedpcbckm', value: _M400bj.pisCstCode });
            _M400Rec.setValue({ fieldId: 'custrecord_mts_codcta_spedpcbckm', value: _M400bj.accountLocNo });

            insertM410(_M400bj.blM410List, _M400Rec);

            _M400Rec.save();
         }
      }

      function insertM410(_M410List, _M400Rec) {
         var taxSetId = _M400Rec.getValue({ fieldId: 'custrecord_mts_no_spedpcbckm' });

         for (var index = 0; index < _M410List.length; index++) {
            var _M410bj = _M410List[index];

            _M400Rec.selectNewLine({ sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm' });

            _M400Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm',
               fieldId: 'custrecord_mts_no_spedpcbckm',
               value: taxSetId
            });

            _M400Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm',
               fieldId: 'custrecord_mts_blockcode_spedpcbckm',
               value: 'M410'
            });

            _M400Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm',
               fieldId: 'custrecord_mts_natrec_spedpcbckm',
               value: _M410bj.natureRevenue
            });

            _M400Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm',
               fieldId: 'custrecord_mts_vlrec_spedpcbckm',
               value: _M410bj.VL_REC
            });

            _M400Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm',
               fieldId: 'custrecord_mts_codcta_spedpcbckm',
               value: _M410bj.accountLocNo
            });

            _M400Rec.commitLine({ sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm' });
         }
      }

      function insertM600(_M600List, taxSettlementRec) {
         for (var index = 0; index < _M600List.length; index++) {
            var _M600bj = _M600List[index];

            var _M600Rec = record.create({ type: 'customrecord_mts_spedpcbckm', isDynamic: true });
            _M600Rec.setValue({ fieldId: 'custrecord_mts_no_spedpcbckm', value: taxSettlementRec.id });

            _M600Rec.setValue({ fieldId: 'custrecord_mts_blockcode_spedpcbckm', value: 'M600' });
            _M600Rec.setValue({ fieldId: 'custrecord_mts_vlretnc_spedpcbckm', value: _M600bj.VL_RET_NC });
            _M600Rec.setValue({ fieldId: 'custrecord_mts_vlretcum_spedpcbckm', value: _M600bj.VL_RET_CUM });
            _M600Rec.setValue({ fieldId: 'custrecord_mts_vltccumper_spedpcbckm', value: _M600bj.VL_TOT_CONT_CUM_PER });
            _M600Rec.setValue({ fieldId: 'custrecord_mts_vlcontcumrec_spedpcbckm', value: _M600bj.VL_CONT_CUM_REC });
            _M600Rec.setValue({ fieldId: 'custrecord_mts_vltotcontrec_spedpcbckm', value: _M600bj.VL_TOT_CONT_REC });

            _M600Rec.save();
         }
      }

      function insertM800(_M800List, taxSettlementRec) {

         for (var index = 0; index < _M800List.length; index++) {
            var _M800bj = _M800List[index];

            var _M800Rec = record.create({ type: 'customrecord_mts_spedpcbckm', isDynamic: true });
            _M800Rec.setValue({ fieldId: 'custrecord_mts_no_spedpcbckm', value: taxSettlementRec.id });

            _M800Rec.setValue({ fieldId: 'custrecord_mts_blockcode_spedpcbckm', value: 'M800' });
            _M800Rec.setValue({ fieldId: 'custrecord_mts_branchcode_spedpcbckm', value: _M800bj.branchCode });
            _M800Rec.setValue({ fieldId: 'custrecord_mts_vltotrec_spedpcbckm', value: _M800bj.VL_TOT_REC });
            _M800Rec.setValue({ fieldId: 'custrecord_mts_cstcofins_spedpcbckm', value: _M800bj.cofinsCstCode });
            _M800Rec.setValue({ fieldId: 'custrecord_mts_codcta_spedpcbckm', value: _M800bj.accountLocNo });

            insertM810(_M800bj.blM810List, _M800Rec);

            _M800Rec.save();
         }
      }

      function insertM810(_M810List, _M800Rec) {
         var taxSetId = _M800Rec.getValue({ fieldId: 'custrecord_mts_no_spedpcbckm' });

         for (var index = 0; index < _M810List.length; index++) {
            var _M810bj = _M810List[index];

            _M800Rec.selectNewLine({ sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm' });

            _M800Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm',
               fieldId: 'custrecord_mts_no_spedpcbckm',
               value: taxSetId
            });

            _M800Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm',
               fieldId: 'custrecord_mts_blockcode_spedpcbckm',
               value: 'M810'
            });

            _M800Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm',
               fieldId: 'custrecord_mts_natrec_spedpcbckm',
               value: _M810bj.natureRevenue
            });

            _M800Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm',
               fieldId: 'custrecord_mts_vlrec_spedpcbckm',
               value: _M810bj.VL_REC
            });

            _M800Rec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm',
               fieldId: 'custrecord_mts_codcta_spedpcbckm',
               value: _M810bj.accountLocNo
            });

            _M800Rec.commitLine({ sublistId: 'recmachcustrecord_mts_subblockcod_spedpcbckm' });
         }
      }
      //---------------- FIM BLOCO M ----------------\\

      /* #endregion */


      /* #region  BLOCO 1  */

      //---------------- INICIO BLOCO 1 -------------\\
      function insert1100(_1100List, taxSettlementRec) {
         for (var index = 0; index < _1100List.length; index++) {
            var _1100Obj = _1100List[index];

            var exportInformationRec = record.create({ type: 'customrecord_mts_expinfrec', isDynamic: true });
            exportInformationRec.setValue({ fieldId: 'custrecord_mts_taxsett_expinfrec', value: taxSettlementRec.id });

            exportInformationRec.setValue({ fieldId: 'custrecord_mts_expdoctype_expinfrec', value: _1100Obj.exportDocType });
            exportInformationRec.setValue({ fieldId: 'custrecord_mts_ddeno_expinfrec', value: _1100Obj.ddeNo });
            exportInformationRec.setValue({ fieldId: 'custrecord_mts_ddedate_expinfrec', value: _1100Obj.ddeDate ? new Date(_1100Obj.ddeDate) : '' });
            exportInformationRec.setValue({ fieldId: 'custrecord_mts_reno_expinfrec', value: _1100Obj.reNo });
            exportInformationRec.setValue({ fieldId: 'custrecord_mts_redate_expinfrec', value: _1100Obj.reDate ? new Date(_1100Obj.reDate) : '' });
            exportInformationRec.setValue({ fieldId: 'custrecord_mts_noshipadv_expinfrec', value: _1100Obj.shipmentAdvice });
            exportInformationRec.setValue({ fieldId: 'custrecord_mts_dateshipadv_expinfrec', value: _1100Obj.dataShipmentAdvice ? new Date(_1100Obj.dataShipmentAdvice) : '' });
            exportInformationRec.setValue({ fieldId: 'custrecord_mts_entrydatshipadv_expinfrec', value: _1100Obj.entryDateShipmentAdvice ? new Date(_1100Obj.entryDateShipmentAdvice) : '' });
            exportInformationRec.setValue({ fieldId: 'custrecord_mts_shipadvtype_expinfrec', value: _1100Obj.shipmentAdviceType });
            exportInformationRec.setValue({ fieldId: 'custrecord_mts_sisccountrycod_expinfrec', value: _1100Obj.siscomex });

            insert1105(_1100Obj._1105List, exportInformationRec);

            exportInformationRec.save();
         }
      }

      function insert1105(_1105List, exportInformationRec) {
         var taxSetId = exportInformationRec.getValue({ fieldId: 'custrecord_mts_taxsett_expinfrec' });

         for (var index = 0; index < _1105List.length; index++) {
            var _1105Obj = _1105List[index];

            exportInformationRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_exportinfrec_exptaxdoc' });
            exportInformationRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_exportinfrec_exptaxdoc',
               fieldId: 'custrecord_mts_taxsett_exptaxdoc',
               value: taxSetId
            });

            exportInformationRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_exportinfrec_exptaxdoc',
               fieldId: 'custrecord_mts_fiscdoctype_exptaxdoc',
               value: _1105Obj.fiscDocType
            });

            exportInformationRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_exportinfrec_exptaxdoc',
               fieldId: 'custrecord_mts_printserie_exptaxdoc',
               value: _1105Obj.serie
            });

            exportInformationRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_exportinfrec_exptaxdoc',
               fieldId: 'custrecord_mts_printsubserie_exptaxdoc',
               value: ''
            });

            exportInformationRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_exportinfrec_exptaxdoc',
               fieldId: 'custrecord_mts_extdocno_exptaxdoc',
               value: _1105Obj.externalDocNo
            });

            exportInformationRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_exportinfrec_exptaxdoc',
               fieldId: 'custrecord_mts_nfekeyacess_exptaxdoc',
               value: _1105Obj.nfeKeyAccess
            });

            exportInformationRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_exportinfrec_exptaxdoc',
               fieldId: 'custrecord_mts_documentdate_exptaxdoc',
               value: _1105Obj.docDate ? new Date(_1105Obj.docDate) : ''
            });

            exportInformationRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_exportinfrec_exptaxdoc',
               fieldId: 'custrecord_mts_no_exptaxdoc',
               value: _1105Obj.item
            });

            exportInformationRec.commitLine({ sublistId: 'recmachcustrecord_mts_exportinfrec_exptaxdoc' });
         }
      }

      function insert1300(_1300List, taxSettlementRec) {

         for (var index = 0; index < _1300List.length; index++) {
            var _1300bj = _1300List[index];

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsett_spedblock1' });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_spedblock1',
               fieldId: 'custrecord_mts_blockcode_spedblock1',
               value: '1300'
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_spedblock1',
               fieldId: 'custrecord_mts_branchcode_spedblock1',
               value: _1300bj.branchCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_spedblock1',
               fieldId: 'custrecord_mts_startdate_spedblock1',
               value: _1300bj.startDate ? new Date(_1300bj.startDate) : ''
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_spedblock1',
               fieldId: 'custrecord_mts_totalamount_spedblock1',
               value: _1300bj.vlTotalpisRetAmount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_spedblock1',
               fieldId: 'custrecord_mts_natretsou_spedblock1',
               value: _1300bj.natureRetentionSource
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsett_spedblock1' });
         }
      }

      function insert1700(_1700List, taxSettlementRec) {

         for (var index = 0; index < _1700List.length; index++) {
            var _1700bj = _1700List[index];

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsett_spedblock1' });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_spedblock1',
               fieldId: 'custrecord_mts_blockcode_spedblock1',
               value: '1700'
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_spedblock1',
               fieldId: 'custrecord_mts_branchcode_spedblock1',
               value: _1700bj.branchCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_spedblock1',
               fieldId: 'custrecord_mts_startdate_spedblock1',
               value: _1700bj.startDate ? new Date(_1700bj.startDate) : ''
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_spedblock1',
               fieldId: 'custrecord_mts_totalamount_spedblock1',
               value: _1700bj.vlTotalcofinsRetAmount
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_spedblock1',
               fieldId: 'custrecord_mts_natretsou_spedblock1',
               value: _1700bj.natureRetentionSource
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsett_spedblock1' });
         }
      }

      function insert1900(_1900List, taxSettlementRec) {

         for (var index = 0; index < _1900List.length; index++) {
            var _1900bj = _1900List[index];

            taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsett_1900' });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_1900',
               fieldId: 'custrecord_mts_branchcode_1900',
               value: _1900bj.branchCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_1900',
               fieldId: 'custrecord_mts_piscst_1900',
               value: _1900bj.pisCstCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_1900',
               fieldId: 'custrecord_mts_cofinscst_1900',
               value: _1900bj.cofinsCstCode
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_1900',
               fieldId: 'custrecord_mts_vltotrec_1900',
               value: _1900bj.VL_TOT_REC
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_1900',
               fieldId: 'custrecord_mts_codsit_1900',
               value: _1900bj.COD_SIT
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_1900',
               fieldId: 'custrecord_mts_codmod_1900',
               value: _1900bj.COD_MOD
            });

            taxSettlementRec.setCurrentSublistValue({
               sublistId: 'recmachcustrecord_mts_taxsett_1900',
               fieldId: 'custrecord_mts_cpfcnpj_1900',
               value: _1900bj.cpfCnpj
            });

            taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsett_1900' });
         }
      }
      //---------------- FIM BLOCO 1 ----------------\\

      /* #endregion */


      /* #region  BLOCO 9  */

      //---------------- INICIO BLOCO 9 -------------\\
      // function insert9900 (_9900List, taxSettlementRec) {
      //     for (var index = 0; index < _9900List.length; index++) {
      //         var _9900Obj = _9900List[index];

      //         taxSettlementRec.selectNewLine({ sublistId: 'recmachcustrecord_mts_taxsettcode_regtotal' });
      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettcode_regtotal',
      //             fieldId: 'custrecord_mts_code_regtotal',
      //             value: _9900Obj.fieldA
      //         });

      //         taxSettlementRec.setCurrentSublistValue({
      //             sublistId: 'recmachcustrecord_mts_taxsettcode_regtotal',
      //             fieldId: 'custrecord_mts_quantity_regtotal',
      //             value: _9900Obj.fieldB
      //         });

      //         taxSettlementRec.commitLine({ sublistId: 'recmachcustrecord_mts_taxsettcode_regtotal' });
      //     }
      // }
      //---------------- FIM BLOCO 9 ----------------\\

      /* #endregion */

      return {
         initStateAbstract: initStateAbstract,
         /* initPercentAbstract: initPercentAbstract, */
         insertPercentAbstract: insertPercentAbstract,
         initCfopAbstract: initCfopAbstract,
         insertCfopAbstract: insertCfopAbstract,
         insertStateAbstract: insertStateAbstract,
         //initSummaryInvoiceAbstract: initSummaryInvoiceAbstract,
         getAmounts: getAmounts,
         initParticipantReg: initParticipantReg,
         insertParticipantReg: insertParticipantReg,
         insert0150: insert0150,
         insert0190: insert0190,
         insert0200: insert0200,
         insert0300: insert0300,
         insert0400: insert0400,
         insert0500: insert0500,
         insert0600: insert0600,
         insertA100: insertA100,
         insertC100: insertC100,
         insertC500: insertC500,
         insertD100: insertD100,
         insertD500: insertD500,
         insertD600: insertD600,
         insertD695: insertD695,
         insertE115: insertE115,
         insertE200: insertE200,
         insertE300: insertE300,
         insertE510: insertE510,
         insertF100: insertF100,
         insertF500: insertF500,
         insertF525: insertF525,
         insertF600: insertF600,
         insertG110: insertG110,
         insertH005: insertH005,
         insertK200: insertK200,
         insertM200: insertM200,
         insertM400: insertM400,
         insertM600: insertM600,
         insertM800: insertM800,
         insert1100: insert1100,
         insert1300: insert1300,
         insert1700: insert1700,
         insert1900: insert1900
      }
   });
