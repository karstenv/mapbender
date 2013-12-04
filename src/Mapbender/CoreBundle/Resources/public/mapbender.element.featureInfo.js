(function($){

    $.widget("mapbender.mbFeatureInfo", {
        options: {
            layers: undefined,
            target: undefined,
            deactivateOnClose: true
        },
        map: null,
        mapClickHandler: null,
        popup: null,
        _create: function(){
            if(!Mapbender.checkTarget("mbFeatureInfo", this.options.target)){
                return;
            }
            var self = this;
            Mapbender.elementRegistry.onElementReady(this.options.target, $.proxy(self._setup, self));
        },

        _setup: function() {
            this._trigger('ready');
            this._ready();
        },
        _setOption: function(key, value){
            switch(key){
                case "layers":
                    this.options.layers = value;
                    break;
                default:
                    throw "Unknown or unhandled option " + key + " for " + this.namespace + "." + this.widgetName;
            }
        },
        /**
         * Default action for mapbender element
         */
        defaultAction: function(callback){
            this.activate(callback);
        },
        activate: function(callback){
            this.callback = callback ? callback : null;
            var self = this;
            this.map = $('#' + this.options.target).data('mapQuery');
            $('#' + this.options.target).addClass('mb-feature-info-active');
            this.mapClickHandler = function(e){
                self._triggerFeatureInfo.call(self, e);
            };
            this.map.element.bind('click', self.mapClickHandler);
        },
        deactivate: function(){
            if(this.map){
                $('#' + this.options.target).removeClass('mb-feature-info-active');
                this.map.element.unbind('click', this.mapClickHandler);
                $(".toolBarItemActive").removeClass("toolBarItemActive");
                if(this.popup){
                    if(this.popup.$element){
                        this.popup.destroy();
                    }
                    this.popup = null;
                }
            }
            this.callback ? this.callback.call() : this.callback = null;
        },
        /**
         * Trigger the Feature Info call for each layer. 
         * Also set up feature info dialog if needed.
         */
        _triggerFeatureInfo: function(e){
            var self = this,
                    x = e.pageX - $(this.map.element).offset().left,
                    y = e.pageY - $(this.map.element).offset().top,
                    fi_exist = false;

            $(this.element).empty();

            var tabContainer = $('<div id="featureInfoTabContainer" class="tabContainer featureInfoTabContainer">' +
                    '<ul class="tabs"></ul>' +
                    '</div>');
            var header = tabContainer.find(".tabs");
            var layers = this.map.layers();
            var newTab, newContainer;

            // XXXVH: Need to optimize this section for better performance!
            // Go over all layers
            $.each(this.map.layers(), function(idx, layer){
                if(!layer.visible()){
                    return;
                }
                if(!layer.olLayer.queryLayers || layer.olLayer.queryLayers.length === 0){
                    return;
                }
                fi_exist = true;
                // Prepare result tab list
                newTab = $('<li id="tab' + layer.id + '" class="tab">' + layer.label + '</li>');
                newContainer = $('<div id="container' + layer.id + '" class="container"></div>');

                // activate the first container
                if(idx == 0){
                    newTab.addClass("active");
                    newContainer.addClass("active");
                }

                header.append(newTab);
                tabContainer.append(newContainer);

                switch(layer.options.type){
                    case 'wms':
                        Mapbender.source.wms.featureInfo(layer, x, y, $.proxy(self._featureInfoCallback, self));
                        break;
                }
            });

            var content = (fi_exist) ? tabContainer : '<p class="description">No feature info layer exists.</p>';

            if(!this.popup || !this.popup.$element){
                this.popup = new Mapbender.Popup2({
                    title: self.element.attr('title'),
                    draggable: true,
                    modal: false,
                    closeButton: false,
                    closeOnPopupCloseClick: false,
                    closeOnESC: false,
                    content: content,
                    width: 500,
                    buttons: {
                        'ok': {
                            label: 'Close',
                            cssClass: 'button right',
                            callback: function(){
                                if(self.options.deactivateOnClose) {
                                    self.deactivate();
                                }else{
                                    this.close();
                                }
                            }
                        }
                    }
                });
            }else{
                this.popup.open(content);
            }
        },
        /**
         * Once data is coming back from each layer's FeatureInfo call,
         * insert it into the corresponding tab.
         */
        _featureInfoCallback: function(data){
            var text = '';
            try{ // cut css
                text = data.response.replace(/document.writeln[^;]*;/g, '')
                        .replace(/\n/g, '')
                        .replace(/<link[^>]*>/gi, '')
                        .replace(/<style[^>]*(?:[^<]*<\/style>|>)/gi, '');
            }catch(e){
            }
            //TODO: Needs some escaping love
            $('#container' + data.layerId).removeClass('loading').html(text);
        },
        /**
         *
         */
        ready: function(callback){
            if(this.readyState === true){
                callback();
            }else{
                this.readyCallbacks.push(callback);
            }
        },
        /**
         *
         */
        _ready: function(){
            for(callback in this.readyCallbacks){
                callback();
                delete(this.readyCallbacks[callback]);
            }
            this.readyState = true;
        }
    });
})(jQuery);