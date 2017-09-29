odoo.define('drag_drop_upload', function (require){
    var rowCount = 0;
    var status = 0;
    var core = require('web.core');
    var Sidebar = require('web.Sidebar');
    var _t = core._t;

    Sidebar.include({
        redraw: function(){
            var self = this;
            this._super(this);
            var obj = $('.o_sidebar_add_attachment');
            obj.each(function(index, elem){
                $(elem).find('form.o_form_binary_form').append('<div class="dropText">' + _t('Drop Files Here') + '</div>');
                $(elem).append('<div id="status"></div>');
                $(elem).on('dragenter', function(e){
                    e.stopPropagation();
                    e.preventDefault();
                    $(this).css('border', '2px dashed #7c7bad');
                });

                $(elem).on('dragover', function(e){
                     e.stopPropagation();
                     e.preventDefault();
                });

                $(elem).on({
                    drop: function(e){
                        $(this).css('border', '2px dashed #7c7bad');
                        e.preventDefault();
                        self.handleFile(e.originalEvent.dataTransfer.files, elem);
                    },
                });

                /*
                If files dropped outside
                 */
                $(document).on('dragenter', function(e){
                    e.stopPropagation();
                    e.preventDefault();
                });

                $(document).on('dragover', function(e){
                  e.stopPropagation();
                  e.preventDefault();
                  $(elem).css('border', '2px dotted #7c7bad');
                });

                $(document).on('drop', function(e){
                    e.stopPropagation();
                    e.preventDefault();
                });
            });

            if(this.$el.parents('.modal-footer').length === 1){//if in modal
                this.$el.find('.oe_form_dropdown_section').each(function(){
                    var $list = $(this).find('ul');
                    $list.css('top','-'+($list.height()+10)+'px');
                    $(this).find('i').removeClass('fa-caret-down').addClass('fa-caret-up');
                });
            }
        },
        handleFile: function(files, elem){
            var self = this;
            callback = $(elem).find("input[name='callback']").val();
            var id = $(elem).find("input[name='id']").val();
            var model = $(elem).find("input[name='model']").val();

            for (var i = 0; i < files.length; i++){
                var formData = new FormData();
                formData.append('ufile', files[i]);
                formData.append('callback', callback);
                formData.append('id', id);
                formData.append('model', model);
                formData.append('paper_date', false);
                formData.append('paper_id', false);

                var status = new this.createStatusbar(elem);
                status.setFileNameSize(files[i].name,files[i].size);
                this.sendToServer(formData, status);
            }
        },
        sendToServer: function(formData, status){
            var self = this;
            var uploadURL = "/ddup/binary/upload_attachment";
            var jqXHR = $.ajax({
                xhr: function(){
                    var xhrobj = $.ajaxSettings.xhr();
                    if (xhrobj.upload){
                        xhrobj.upload.addEventListener('progress', function(event){
                            var percent = 0;
                            var rowNr = [];
                            var position = event.loaded || event.position;
                            var total = event.total;
                            if (event.lengthComputable){
                                percent = Math.ceil(position / total * 100);
                            }
                            $('.o_sidebar_add_attachment:visible').find('#status > .statusbar').each(function(index){
                                rowNr[index] = $(this).data('nr');
                            });
                            if($.inArray(status.rowNr, rowNr) < 0){
                                $('.o_sidebar_add_attachment:visible').find('#status').append(status.statusbar);
                                status.abort.click( function(){
                                    jqXHR.abort();
                                    status.statusbar.hide();
                                });
                            }
                            status.setProgress(percent);
                        }, false);
                    }
                    return xhrobj;
                },
                url: uploadURL,
                type: "POST",
                contentType:false,
                processData: false,
                cache: false,
                data: formData,
                success: function(data){
                    $('#'+callback).contents().find("head").append(data);
                    status.setProgress(100);
                    //self.redraw();
                }
            });
            status.setAbort(jqXHR);
        },
        createStatusbar: function(elem){
            rowCount++;
            this.rowNr = rowCount;
            var row="odd";
            if(rowCount %2 ==0) row ="even";
            this.statusbar = $("<div class='statusbar "+ row + "' data-nr='"+ rowCount +"'></div>");
            this.filename = $("<div class='filename'></div>").appendTo(this.statusbar);
            this.size = $("<div class='filesize'></div>").appendTo(this.statusbar);
            this.progressBar = $("<div class='progressBar'><div></div></div>").appendTo(this.statusbar);
            this.abort = $("<div class='abort'>Abort</div>").appendTo(this.statusbar);
            $(elem).find('#status').append(this.statusbar);

            this.setFileNameSize = function(name,size){
                var sizeStr="";
                var sizeKB = size/1024;
                if(parseInt(sizeKB) > 1024){
                    var sizeMB = sizeKB/1024;
                    sizeStr = sizeMB.toFixed(2)+" MB";
                }else{
                    sizeStr = sizeKB.toFixed(2)+" KB";
                }
                this.filename.html(name);
                this.size.html(sizeStr);
            }
            this.setProgress = function(progress){
                var progressBarWidth =progress*this.progressBar.width()/ 100;
                this.progressBar.find('div').animate({ width: progressBarWidth }, 10).html(progress + "% ");
                if(parseInt(progress) >= 100){
                    this.abort.hide();
                }
            }
            this.setAbort = function(jqxhr){
                var sb = this.statusbar;
                this.abort.click( function(){
                    jqxhr.abort();
                    sb.hide();
                });
            }
        }
    });

    /*instance.web.form.One2ManyListView.include({
        _template: 'One2Many.listview',
        do_activate_record: function(index, id) {
            var self = this;
            this.pop = new instance.web.form.FormOpenPopup(self);
            this.pop.show_element(self.o2m.field.relation, id, self.o2m.build_context(), {
                title: _t("Open: ") + self.o2m.string,
                write_function: function(id, data) {
                    return self.o2m.dataset.write(id, data, {}).done(function() {
                        self.o2m.reload_current_view();
                    });
                },
                alternative_form_view: self.o2m.field.views ? self.o2m.field.views["form"] : undefined,
                parent_view: self.o2m.view,
                child_name: self.o2m.name,
                read_function: function() {
                    return self.o2m.dataset.read_ids.apply(self.o2m.dataset, arguments);
                },
                form_view_options: {'not_interactible_on_create':true},
                readonly: !this.is_action_enabled('edit') || self.o2m.get("effective_readonly")
            });
            instance.web.bus.on('form_view_shown', self, function(){
                self.structure();
            });
        },
        do_add_record: function(){
            if (this.editable()){
                this._super.apply(this, arguments);
            }else{
                var self = this;
                this.pop = new instance.web.form.SelectCreatePopup(this);
                this.pop.select_element(
                    self.o2m.field.relation,
                    {
                        title: _t("Create: ") + self.o2m.string,
                        //initial_view: "form",
                        initial_view: "form",
                        //alternative_form_view: self.o2m.field.views ? self.o2m.field.views["form"] : undefined,
                        create_function: function(data, options) {
                            return self.o2m.dataset.create(data, options).done(function(r){
                                self.o2m.dataset.set_ids(self.o2m.dataset.ids.concat([r]));
                                self.o2m.dataset.trigger("dataset_changed", r);
                            });
                        },
                        read_function: function(){
                            return self.o2m.dataset.read_ids.apply(self.o2m.dataset, arguments);
                        },
                        parent_view: self.o2m.view,
                        child_name: self.o2m.name,
                        form_view_options: {'not_interactible_on_create':true}
                    },
                    self.o2m.build_domain(),
                    self.o2m.build_context()
                );
                this.pop.on("elements_selected", self, function(){
                    self.o2m.reload_current_view();
                });
                //var loaded = $.Deferred();
                //self.pop.view_form.on('form_view_loaded', self, function(){
                self.pop.view_form.on('load_record', self, function(){
                    //loaded.resolve();
                    //$.async_when().done(function(){
                        self.structure();
                    //});
                });
            }
        },
        structure: function(){
            var self = this;
            var obj = self.pop.view_form.$el;
            $(obj).find('td.oe_form_binary').each(function(index, elem){
                $(elem).parent('tr').after('<tr class="dropText"><td colspan="4"><span>' + _t('Drop Files Here') + '</span></td></tr>');
                $(elem).parent().parent().find('tr.dropText').after('<div id="status"></div>');

                $(elem).parent().parent().find('tr.dropText').on('dragenter', function (e){
                    e.stopPropagation();
                    e.preventDefault();
                    $(this).css('border', '2px dashed #7c7bad');
                });

                $(elem).parent().parent().find('tr.dropText').on('dragover', function (e){
                     e.stopPropagation();
                     e.preventDefault();
                });

                $(elem).parent().parent().find('tr.dropText').on({
                    drop: function(e){
                        $(this).css('border', '2px dashed #7c7bad');
                        e.preventDefault();
                        self.handleFile(e.originalEvent.dataTransfer.files, elem);
                    },
                    change: function(e){
                        $(this).css('border', '2px dashed #7c7bad');
                        e.preventDefault();
                        //self.handleFile($(this).find('.oe_form_binary_file').prop('files'), elem);
                    }
                });

                $(document).on('dragenter', function(e){
                    e.stopPropagation();
                    e.preventDefault();
                });

                $(document).on('dragover', function(e){
                  e.stopPropagation();
                  e.preventDefault();
                  $(elem).parent().parent().find('tr.dropText').css('border', '2px dotted #7c7bad');
                });

                $(document).on('drop', function(e){
                    e.stopPropagation();
                    e.preventDefault();
                });
            })
        },
        handleFile: function(files, elem){
            var self = this;
            callback = $(elem).find("input[name='callback']").val();
            var id = $(elem).find("input[name='id']").val();
            var model = $(elem).find("input[name='model']").val();

            for (var i = 0; i < files.length; i++){
                var formData = new FormData();
                formData.append('ufile', files[i]);
                formData.append('callback', callback);
                formData.append('id', id);
                formData.append('model', model);
                formData.append('paper_date', false);
                formData.append('paper_id', false);

                var status = new this.createStatusbar(elem);
                status.setFileNameSize(files[i].name,files[i].size);
                this.sendToServer(formData, status);
            }
        },
        sendToServer: function(formData, status){
            var uploadURL = "/ddup/binary/upload_attachment";
            var jqXHR = $.ajax({
                xhr: function(){
                    var xhrobj = $.ajaxSettings.xhr();
                    if (xhrobj.upload){
                        xhrobj.upload.addEventListener('progress', function(event){
                            var percent = 0;
                            var rowNr = [];
                            var position = event.loaded || event.position;
                            var total = event.total;
                            if (event.lengthComputable){
                                percent = Math.ceil(position / total * 100);
                            }
                            $('.oe_sidebar_add_attachment:visible').find('#status > .statusbar').each(function(index){
                                rowNr[index] = $(this).data('nr');
                            });
                            if($.inArray(status.rowNr, rowNr) < 0){
                                $('.oe_sidebar_add_attachment:visible').find('#status').append(status.statusbar);
                                status.abort.click( function(){
                                    jqXHR.abort();
                                    status.statusbar.hide();
                                });
                            }
                            status.setProgress(percent);
                        }, false);
                    }
                    return xhrobj;
                },
                url: uploadURL,
                type: "POST",
                contentType:false,
                processData: false,
                cache: false,
                data: formData,
                success: function(data){
                    $('#'+callback).contents().find("head").append(data);
                    status.setProgress(100);
                }
            });
            status.setAbort(jqXHR);
        },
        createStatusbar: function(elem){
            rowCount++;
            this.rowNr = rowCount;
            var row="odd";
            if(rowCount %2 ==0) row ="even";
            this.statusbar = $("<div class='statusbar "+ row + "' data-nr='"+ rowCount +"'></div>");
            this.filename = $("<div class='filename'></div>").appendTo(this.statusbar);
            this.size = $("<div class='filesize'></div>").appendTo(this.statusbar);
            this.progressBar = $("<div class='progressBar'><div></div></div>").appendTo(this.statusbar);
            this.abort = $("<div class='abort'>Abort</div>").appendTo(this.statusbar);
            $(elem).find('#status').append(this.statusbar);

            this.setFileNameSize = function(name,size){
                var sizeStr="";
                var sizeKB = size/1024;
                if(parseInt(sizeKB) > 1024){
                    var sizeMB = sizeKB/1024;
                    sizeStr = sizeMB.toFixed(2)+" MB";
                }else{
                    sizeStr = sizeKB.toFixed(2)+" KB";
                }
                this.filename.html(name);
                this.size.html(sizeStr);
            }
            this.setProgress = function(progress){
                var progressBarWidth =progress*this.progressBar.width()/ 100;
                this.progressBar.find('div').animate({ width: progressBarWidth }, 10).html(progress + "% ");
                if(parseInt(progress) >= 100){
                    this.abort.hide();
                }
            }
            this.setAbort = function(jqxhr){
                var sb = this.statusbar;
                this.abort.click( function(){
                    jqxhr.abort();
                    sb.hide();
                });
            }
        }
    })*/

    /*instance.dad_upload = {}
    instance.web.form.widgets.add('dad_upload', 'instance.dad_upload.DaDUploadFormWidget')
    instance.dad_upload.DaDUploadFormWidget = instance.web.form.FieldBinary.extend({
        template: 'DaDFieldBinaryFile',
        init: function(field_manager, node){
            this._super(field_manager, node);
            this.field_manager = field_manager;
            this.node = node;
            this.fileupload_id = _.uniqueId('oe_fileupload');
        },
        initialize_content: function() {
            var self = this;
            this._super();
            self.$el.css('border', '2px dotted #7c7bad');
            self.$el.css('background-color', '#ebebeb');
            this.$el.find('form.oe_form_binary_form').append('<div class="dropFiles">' + _t('Drop Files Here') + '</div>');
            this.$el.append('<div id="status"></div>');

            this.$el.on('dragenter', function(e){
                e.stopPropagation();
                e.preventDefault();
                $(this).css('border', '2px dashed #7c7bad');
            });

            this.$el.on('dragover', function(e){
                 e.stopPropagation();
                 e.preventDefault();
            });

            this.$el.on({
                drop: function(e){
                    $(this).css('border', '2px dashed #7c7bad');
                    e.preventDefault();
                    self.handleFile(e.originalEvent.dataTransfer.files);
                },
                change: function(e){
                    $(this).css('border', '2px dashed #7c7bad');
                    e.preventDefault();
                    self.handleFile($(this).find('.oe_form_binary_file').prop('files'));
                }
            });

            $(document).on('dragover', function(e){
              e.stopPropagation();
              e.preventDefault();
              self.$el.css('border', '2px dotted #7c7bad');
            });
        },
        handleFile: function(files){
            var self = this;
            callback = self.$el.find("input[name='callback']").val();
            var id = self.view.datarecord.id;
            var model = self.view.dataset.model;

            for (var i = 0; i < files.length; i++){
                var formData = new FormData();


                if(self.view.fields.paper_date_required){
                    if(self.view.fields.paper_date_required.get_value()){
                        if(self.view.fields.paper_date.get_value()){
                            formData.append('paper_date',self.view.fields.paper_date.get_value());
                        }
                        else{
                            self.view.do_notify("Kein Datum gewählt", "Bitte wählen Sie ein Gültigkeitsdatum.");
                            return;
                        }
                    }
                    else{
                        formData.append('paper_date', false);
                    }
                }
                if(self.view.fields.paper_id){
                    formData.append('paper_id',self.view.fields.paper_id.get_value());
                }
                else{
                    formData.append('paper_id', false);
                }
                formData.append('ufile', files[i]);
                formData.append('callback', callback);
                formData.append('id', id);
                formData.append('model', model);
                var status = new this.createStatusbar(self.$el);
                status.setFileNameSize(files[i].name,files[i].size);
                this.sendToServer(formData, status);
            }
        },
        sendToServer: function(formData, status){
            self_view = this;
            var uploadURL = "/ddup/binary/upload_attachment";
            var jqXHR = $.ajax({
                xhr: function(){
                    var xhrobj = $.ajaxSettings.xhr();
                    if (xhrobj.upload){
                        xhrobj.upload.addEventListener('progress', function(event){
                            var percent = 0;
                            var rowNr = [];
                            var position = event.loaded || event.position;
                            var total = event.total;
                            if (event.lengthComputable){
                                percent = Math.ceil(position / total * 100);
                            }
                            $('.oe_sidebar_add_attachment:visible').find('#status > .statusbar').each(function(index){
                                rowNr[index] = $(this).data('nr');
                            });
                            if($.inArray(status.rowNr, rowNr) < 0){
                                $('.oe_sidebar_add_attachment:visible').find('#status').append(status.statusbar);
                                status.abort.click( function(){
                                    jqXHR.abort();
                                    status.statusbar.hide();
                                });
                            }
                            status.setProgress(percent);
                        }, false);
                    }
                    return xhrobj;
                },
                url: uploadURL,
                type: "POST",
                contentType:false,
                processData: false,
                cache: false,
                data: formData,
                success: function(data){
                    $('#'+callback).contents().find("head").append(data);
                    status.setProgress(100);
                    self_view.view.reload();
                }
            });
            status.setAbort(jqXHR);
        },
        createStatusbar: function($el){
            rowCount++;
            this.rowNr = rowCount;
            var row="odd";
            if(rowCount %2 ==0) row ="even";
            this.statusbar = $("<div class='statusbarFiles "+ row + "' data-nr='"+ rowCount +"'></div>");
            this.filename = $("<div class='filename'></div>").appendTo(this.statusbar);
            this.size = $("<div class='filesize'></div>").appendTo(this.statusbar);
            this.progressBar = $("<div class='progressBar'><div></div></div>").appendTo(this.statusbar);
            this.abort = $("<div class='abort'>Abort</div>").appendTo(this.statusbar);
            $el.find('#status').append(this.statusbar);

            this.setFileNameSize = function(name,size){
                var sizeStr="";
                var sizeKB = size/1024;
                if(parseInt(sizeKB) > 1024){
                    var sizeMB = sizeKB/1024;
                    sizeStr = sizeMB.toFixed(2)+" MB";
                }else{
                    sizeStr = sizeKB.toFixed(2)+" KB";
                }
                this.filename.html(name);
                this.size.html(sizeStr);
            }
            this.setProgress = function(progress){
                var progressBarWidth =progress*this.progressBar.width()/ 100;
                this.progressBar.find('div').animate({ width: progressBarWidth }, 10).html(progress + "% ");
                if(parseInt(progress) >= 100){
                    this.abort.hide();
                }
            }
            this.setAbort = function(jqxhr){
                var sb = this.statusbar;
                this.abort.click( function(){
                    jqxhr.abort();
                    sb.hide();
                });
            }
        }
    })*/
});
