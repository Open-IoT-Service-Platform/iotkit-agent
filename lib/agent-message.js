/*
Copyright (c) 2014, Intel Corporation

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
'use strict';
var Comp = require('./comp.registration'),
    Data = require('./data.submission'),
    Sensor = require('./sensors-store'),
    schemaValidation = require('./schema-validator')

var MessageHandler = function(connector, logger) {
    var me = this;
    me.store = Sensor.init("device.json", logger);
    me.comp = Comp.init(connector, me.store, logger);
    me.data = Data.init(connector,  me.store, logger);

    me.handler = function (msg, callback) {
        var msgResult = [];

        // Validate for component schema
        if(schemaValidation.validate(msg, schemaValidation.schemas.component.REG).length === 0) {
            me.comp.registration(msg, function (status_reg) {
                if (status_reg === false) {
                    msgResult.push(new Error("Component registration failed!"));
                    logger.error('Component registration failed: ', msg, msgResult);
                }
                if (callback) {
                    return callback(status_reg);
                }
            });
            return;
        }

        // Validate data submission
        if (schemaValidation.validate(msg, schemaValidation.schemas.data.SUBMIT).length === 0) {
            me.data.submission(msg, function (status_sub) {
                if (status_sub === false) {
                    msgResult.push(new Error("None Submit data matching"));
                    logger.error('Invalid message received (empty) : ', msg, msgResult);
                }
                if (callback) {
                    callback(status_sub);
                }
            });
            return;
        }

        // Validate device update
        if (schemaValidation.validate(msg, schemaValidation.schemas.device.UPDATE).length === 0) {
            connector.update(msg, function (status_dev) {
                logger.info("Response received: ", status_dev);
                if (callback) {
                    callback(status_dev);
                }
            });
            return;
        }

        // Data matched no valid schema
        if (callback) {
            callback('Message invalid');
        }
    };
};

var init = function(connector, logger) {
    return new MessageHandler(connector, logger);
};
module.exports = {
    init : init
};
