/**
 * Product Slider
 *
 * A jQuery Plugin for dynamic sliders.
 * It has functionality for slide and scroll animations.
 * Supports momentum scrolling via touch gestures on mobile devices.
 * Can load items via ajax or use an existing dom structure.
 * Use the different config options to adjust the slider to your needs.
 *
 * @Example DOM structure:
 *
 * <div class="product-slider">
 *     <div class="product-slider--container">
 *         <div class="product-slider--item"></div>
 *         <div class="product-slider--item"></div>
 *         <div class="product-slider--item"></div>
 *     </div>
 * </div>
 */
;(function ($, window) {
    'use strict';

    /**
     * Private window object
     */
    var $window = $(window);

    /**
     * Additional jQuery easing methods.
     */
    jQuery.extend(jQuery.easing, {
        easeOutExpo: function (x, t, b, c, d) {
            return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
        }
    });

    /**
     * Browser compatibility for requestAnimationFrame
     * with polyfill for legacy browsers.
     */
    var lastFrame,
        requestAnimationFrame = (function () {
            return  window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                window.msRequestAnimationFrame     ||
                window.oRequestAnimationFrame      ||
                function(callback, element) {
                    var currFrame = new Date().getTime(),
                        animationTime = Math.max(0, 16 - (currFrame - lastFrame)),
                        animationID = window.setTimeout(function() { callback(currFrame + animationTime); }, animationTime);

                    lastFrame = currFrame + animationTime;
                    return animationID;
                };
        })(),
        cancelAnimationFrame = (function () {
            return  window.cancelAnimationFrame                 ||
                window.cancelRequestAnimationFrame          ||
                window.webkitCancelAnimationFrame           ||
                window.webkitCancelRequestAnimationFrame    ||
                window.mozCancelAnimationFrame              ||
                window.mozCancelRequestAnimationFrame       ||
                window.msCancelAnimationFrame               ||
                window.msCancelRequestAnimationFrame        ||
                window.oCancelAnimationFrame                ||
                window.oCancelRequestAnimationFrame         ||
                function(id) {
                    clearTimeout(id);
                };
        })();

    /**
     * Product Slider Plugin
     */
    $.plugin('swProductSlider', {

        alias: 'productSlider',

        defaults: {

            /**
             * The mode for getting the items.
             *
             * @property mode ( local | ajax )
             * @type {String}
             */
            mode: 'local',

            /**
             * The orientation of the slider.
             *
             * @property orientation ( horizontal | vertical )
             * @type {String}
             */
            orientation: 'horizontal',

            /**
             * The minimal width a slider item should have.
             * Used for horizontal sliders.
             *
             * @property itemMinWidth
             * @type {Number}
             */
            itemMinWidth: 220,

            /**
             * The minimal height a slider item should have.
             * Used for vertical sliders.
             *
             * @property itemMinHeight
             * @type {Number}
             */
            itemMinHeight: 240,

            /**
             * Number of items moved on each slide.
             *
             * @property itemsPerPage
             * @type {Number}
             */
            itemsPerSlide: 1,

            /**
             * Turn automatic sliding on and off.
             *
             * @property autoSlide
             * @type {Boolean}
             */
            autoSlide: false,

            /**
             * Direction of the auto sliding.
             *
             * @property autoSlideDirection ( next | prev )
             * @type {String}
             */
            autoSlideDirection: 'next',

            /**
             * Time in seconds between each auto slide.
             *
             * @property autoSlideSpeed
             * @type {Number}
             */
            autoSlideSpeed: 4,

            /**
             * Turn automatic scrolling on and off.
             *
             * @property autoScroll
             * @type {Boolean}
             */
            autoScroll: false,

            /**
             * Direction if the auto scrolling.
             *
             * @property autoScrollDirection ( next | prev )
             * @type {String}
             */
            autoScrollDirection: 'next',

            /**
             * Distance in px for every auto scroll step.
             *
             * @property autoScrollSpeed
             * @type {Number}
             */
            autoScrollSpeed: 1,

            /**
             * Distance in px for scroll actions triggered by arrow controls.
             *
             * @property scrollDistance
             * @type {Number}
             */
            scrollDistance: 350,

            /**
             * Speed in ms for slide animations.
             *
             * @property animationSpeed
             * @type {Number}
             */
            animationSpeed: 800,

            /**
             * Turn arrow controls on and off.
             *
             * @property arrowControls
             * @type {Boolean}
             */
            arrowControls: true,

            /**
             * The type of action the arrows should trigger.
             *
             * @property arrowAction ( slide | scroll )
             * @type {String}
             */
            arrowAction: 'slide',

            /**
             * The css class for the slider wrapper.
             *
             * @property wrapperCls
             * @type {String}
             */
            wrapperCls: 'product-slider',

            /**
             * The css class for the horizontal state.
             *
             * @property horizontalCls
             * @type {String}
             */
            horizontalCls: 'is--horizontal',

            /**
             * The css class for the vertical state.
             *
             * @property verticalCls
             * @type {String}
             */
            verticalCls: 'is--vertical',

            /**
             * The css class for the arrow controls.
             *
             * @property arrowCls
             * @type {String}
             */
            arrowCls: 'product-slider--arrow',

            /**
             * The css class for the left arrow.
             *
             * @property prevArrowCls
             * @type {String}
             */
            prevArrowCls: 'arrow--prev',

            /**
             * The css class for the right arrow.
             *
             * @property nextArrowCls
             * @type {String}
             */
            nextArrowCls: 'arrow--next',

            /**
             * The selector for the item container.
             *
             * @property containerSelector
             * @type {String}
             */
            containerSelector: '.product-slider--container',

            /**
             * The selector for the single items.
             *
             * @property itemSelector
             * @type {String}
             */
            itemSelector: '.product-slider--item',

            /**** Ajax Config ****/

            /**
             * The controller url for ajax loading.
             *
             * @property ajaxCtrlUrl
             * @type {String}
             */
            ajaxCtrlUrl: null,

            /**
             * The category id for ajax loading.
             *
             * @property ajaxCategoryID
             * @type {Number}
             */
            ajaxCategoryID: 3,

            /**
             * The maximum number of items to load via ajax.
             *
             * @property ajaxMaxShow
             * @type {Number}
             */
            ajaxMaxShow: 30
        },

        /**
         * Initializes the plugin
         *
         * @public
         * @method init
         */
        init: function () {
            var me = this;

            me.applyDataAttributes();

            me.autoScrollAnimation = false;
            me.autoSlideAnimation = false;
            me.bufferedCall = false;

            me.isLoading = false;
            me.isAnimating = false;

            if (me.opts.mode === 'ajax' && me.opts.ajaxCtrlUrl === null) {
                console.error('The controller url for the ajax slider is not defined!');
                return;
            }

            me.initSlider();
            me.registerEvents();
        },

        /**
         * Updates the plugin.
         *
         * @public
         * @method update
         */
        update: function () {
            var me = this;

            me.trackItems();
            me.setSizes();

            /**
             * Always set back to the first item on update
             */
            me.setPosition(0);
            me.trackArrows();

            $.publish('plugin/swProductSlider/onUpdate', me);
        },

        /**
         * Initializes all necessary slider configs.
         *
         * @public
         * @method initSlider
         */
        initSlider: function () {
            var me = this,
                opts = me.opts;

            me.$el.addClass(opts.wrapperCls);

            me.createContainer();
            me.trackItems();
            me.setSizes();

            /**
             * Used for smooth animations.
             */
            me.currentPosition = me.getScrollPosition();

            if (me.itemsCount <= 0 && opts.mode === 'ajax') {
                me.loadItems(0, Math.min(me.itemsPerPage * 2, opts.ajaxMaxShow), $.proxy(me.initSlider, me));
                return;
            }

            if (me.opts.arrowControls && me.isActive()) me.createArrows();
            if (me.opts.autoScroll && me.isActive()) me.autoScroll();
            if (me.opts.autoSlide && me.isActive()) me.autoSlide();

            $.publish('plugin/swProductSlider/onInitSlider', me);
        },

        /**
         * Registers all necessary event listeners.
         *
         * @public
         * @method registerEvents
         */
        registerEvents: function () {
            var me = this;

            me._on(me.$el, 'touchstart mouseenter', $.proxy(me.onMouseEnter, me));
            me._on(me.$el, 'mouseleave', $.proxy(me.onMouseLeave, me));

            me._on(me.$container, 'scroll', $.proxy(me.onScroll, me));

            me._on($window, 'resize', $.proxy(me.buffer, me, me.update, 600));

            $.publish('plugin/swProductSlider/onRegisterEvents', me);
        },

        /**
         * Returns the active state of the slider.
         *
         * @public
         * @method isActive
         * @returns {Boolean}
         */
        isActive: function () {
            var me = this;

            return me.$items.length > me.itemsPerPage;
        },

        /**
         * Returns the current position of the slider.
         *
         * @public
         * @method getScrollPosition
         * @param {String} orientation
         * @returns {jQuery}
         */
        getScrollPosition: function (orientation) {
            var me = this,
                o = orientation || me.opts.orientation;

            return (o === 'vertical') ? me.$container.scrollTop() : me.$container.scrollLeft();
        },

        /**
         * Sets the position of the slider.
         *
         * @public
         * @method setPosition
         * @param {Number} position
         */
        setPosition: function (position) {
            var me = this,
                pos = position || 0,
                method = (me.opts.orientation === 'vertical') ? 'scrollTop' : 'scrollLeft';

            me.$container[method](pos);
            me.currentPosition = pos;

            $.publish('plugin/swProductSlider/onSetPosition', [me, pos]);
        },

        /**
         * Sets all necessary size values of the slider.
         *
         * @public
         * @method setSizes
         * @param {String} orientation
         */
        setSizes: function (orientation) {
            var me = this,
                o = orientation || me.opts.orientation,
                containerSize = (o === 'vertical') ? me.$el.innerHeight() : me.$el.innerWidth(),
                itemSize = (o === 'vertical') ? me.opts.itemMinHeight : me.opts.itemMinWidth;

            me.itemsPerPage = Math.floor(containerSize / itemSize);

            if (me.itemsPerPage < 1) me.itemsPerPage = 1;

            me.itemSizePercent = 100 / me.itemsPerPage;

            if (o === 'vertical') {
                me.$items.css({ 'height': me.itemSizePercent + '%' });
                me.itemSize = me.$items.outerHeight();
            } else {
                me.$items.css({ 'width': me.itemSizePercent + '%' });
                me.itemSize = me.$items.outerWidth();
            }

            /**
             * Triggered for sizing lazy loaded images.
             */
            window.picturefill();

            $.publish('plugin/swProductSlider/onSetSizes', [me, orientation]);
        },

        /**
         * Tracks the number of items the slider contains.
         *
         * @public
         * @method trackItems
         * @returns {Number}
         */
        trackItems: function () {
            var me = this;

            me.$items = me.$container.find(me.opts.itemSelector);

            me.itemsCount = me.$items.length;

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/trackItems', me);

            $.publish('plugin/swProductSlider/onTrackItems', [me, me.items, me.itemsCount]);

            return me.itemsCount;
        },

        /**
         * Tracks the arrows and shows/hides them
         *
         * @public
         * @method trackArrows
         */
        trackArrows: function() {
            var me = this;

            if(!me.$arrowPrev || !me.$arrowNext) {
                if (me.isActive() && me.opts.arrowControls) me.createArrows();
                return;
            }

            if (!me.isActive()) {
                me.$arrowPrev.hide();
                me.$arrowNext.hide();
                return;
            }

            /**
             * Five pixel tolerance for momentum scrolling.
             */
            var slideEnd = me.currentPosition + me.$container[(me.opts.orientation === 'vertical') ? 'outerHeight': 'outerWidth']();
            me.$arrowPrev[(me.currentPosition > 5) ? 'show' : 'hide']();
            me.$arrowNext[(slideEnd >= parseInt(me.itemSize * me.itemsCount, 10) - 5) ? 'hide' : 'show']();

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/trackArrows', me);

            $.publish('plugin/swProductSlider/onTrackArrows', [me, me.$arrowPrev, me.$arrowNext]);
        },

        /**
         * Loads new items via ajax.
         *
         * @public
         * @method loadItems
         * @param {Number} start
         * @param {Number} limit
         * @param {Function} callback
         */
        loadItems: function (start, limit, callback) {
            var me = this,
                data = {
                    'category': me.opts.ajaxCategoryID,
                    'start': start,
                    'limit': limit
                };

            me.isLoading = true;

            $.publish('plugin/swProductSlider/onLoadItemsBefore', [me, data]);

            $.ajax({
                url: me.opts.ajaxCtrlUrl,
                method: 'GET',
                data: data,
                success: function (response) {
                    me.isLoading = false;
                    me.$container.append(response);
                    me.trackItems();
                    me.setSizes();
                    me.trackArrows();

                    /** @deprecated - will be removed in 5.1 */
                    $.publish('plugin/productSlider/itemsLoaded');

                    $.publish('plugin/swProductSlider/onLoadItemsSuccess', [me, response]);

                    if (typeof callback === 'function') {
                        callback.call(me, response);
                    }
                }
            });

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/loadItems', me);

            $.publish('plugin/swProductSlider/onLoadItems', me);
        },

        /**
         * Creates and returns the container for the items.
         *
         * @public
         * @method createContainer
         * @param {String} orientation
         * @returns {jQuery}
         */
        createContainer: function (orientation) {
            var me = this,
                o = orientation || me.opts.orientation,
                orientationCls = (o === 'vertical') ? me.opts.verticalCls : me.opts.horizontalCls,
                $container = me.$el.find(me.opts.containerSelector);

            if (!$container.length) {
                $container = $('<div>', {
                    'class': me.opts.containerSelector.substr(1)
                }).appendTo(me.$el);
            }

            $container.addClass(orientationCls);

            me.$container = $container;

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/createContainer', me);

            $.publish('plugin/swProductSlider/onCreateContainer', [me, $container, orientation]);

            return $container;
        },

        /**
         * Creates the arrow controls.
         *
         * @private
         * @method createArrows
         */
        createArrows: function () {
            var me = this,
                orientationCls = (me.opts.orientation === 'vertical') ? me.opts.verticalCls : me.opts.horizontalCls;

            if (!me.opts.arrowControls || !me.isActive()) {
                return;
            }

            if (!me.$arrowPrev) {
                me.$arrowPrev = $('<a>', {
                    'class': me.opts.arrowCls + ' ' +
                        me.opts.prevArrowCls + ' ' +
                        orientationCls
                }).prependTo(me.$el);

                me._on(me.$arrowPrev, 'click', $.proxy(me.onArrowClick, me, 'prev'));
            }

            if (!me.$arrowNext) {
                me.$arrowNext = $('<a>', {
                    'class': me.opts.arrowCls + ' ' +
                        me.opts.nextArrowCls + ' ' +
                        orientationCls
                }).prependTo(me.$el);

                me._on(me.$arrowNext, 'click', $.proxy(me.onArrowClick, me, 'next'));
            }

            me.trackArrows();

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/createArrows', me);

            $.publish('plugin/swProductSlider/onCreateArrows', [me, me.$arrowPrev, me.$arrowNext]);
        },

        /**
         * Event listener for click events on the arrows controls.
         *
         * @public
         * @method onArrowClick
         * @param {String} type
         * @param {jQuery.Event} event
         */
        onArrowClick: function (type, event) {
            var me = this,
                next = (me.opts.arrowAction === 'scroll') ? 'scrollNext' : 'slideNext',
                prev = (me.opts.arrowAction === 'scroll') ? 'scrollPrev' : 'slidePrev';

            event.preventDefault();

            me[(type === 'prev') ? prev : next]();

            $.publish('plugin/swProductSlider/onArrowClick', [me, event, type]);
        },

        /**
         * Event listener for mouseenter event.
         *
         * @public
         * @method onMouseEnter
         */
        onMouseEnter: function (event) {
            var me = this;

            me.stopAutoScroll();
            me.stopAutoSlide();

            $.publish('plugin/swProductSlider/onMouseEnter', [me, event]);
        },

        /**
         * Event listener for mouseleave event.
         *
         * @public
         * @method onMouseLeave
         */
        onMouseLeave: function (event) {
            var me = this;

            if (me.isActive() && me.opts.autoScroll) me.autoScroll();
            if (me.isActive() && me.opts.autoSlide) me.autoSlide();

            $.publish('plugin/swProductSlider/onMouseLeave', [me, event]);
        },

        /**
         * Event listener for scroll event.
         *
         * @public
         * @method onScroll
         */
        onScroll: function (event) {
            var me = this;

            if (!me.isAnimating) {
                me.currentPosition = me.getScrollPosition();
            }

            me.trackArrows();

            if (me.opts.mode !== 'ajax' || me.isLoading) {
                return;
            }

            var position = me.getScrollPosition(),
                scrolledItems = Math.floor(position / me.itemSize),
                itemsLeftToLoad = me.opts.ajaxMaxShow - me.itemsCount,
                loadMoreCount = me.itemsCount - me.itemsPerPage * 2;

            if (scrolledItems >= loadMoreCount && itemsLeftToLoad > 0) {
                me.loadItems(me.itemsCount, Math.min(me.itemsPerPage, itemsLeftToLoad));
            }

            $.publish('plugin/swProductSlider/onScroll', [me, event]);
        },

        /**
         * Moves the slider exactly to the next item(s).
         * Based on the "itemsPerSlide" option.
         *
         * @public
         * @method slideNext
         */
        slideNext: function () {
            var me = this;

            me.currentPosition = Math.floor((me.currentPosition + me.itemSize * me.opts.itemsPerSlide) / me.itemSize) * me.itemSize;
            me.slide(me.currentPosition);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/slideNext', me);

            $.publish('plugin/swProductSlider/onSlideNext', [me, me.currentPosition]);
        },

        /**
         * Moves the slider exactly to the previous item(s).
         * Based on the "itemsPerSlide" option.
         *
         * @public
         * @method slidePrev
         */
        slidePrev: function () {
            var me = this;

            me.currentPosition = Math.ceil((me.currentPosition - me.itemSize * me.opts.itemsPerSlide) / me.itemSize) * me.itemSize;
            me.slide(me.currentPosition);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/slidePrev', me);

            $.publish('plugin/swProductSlider/onSlidePrev', [me, me.currentPosition]);
        },

        /**
         * Moves the slider to the position of an item.
         *
         * @public
         * @method slideToElement
         * @param {jQuery} $el
         * @param {String} orientation
         */
        slideToElement: function ($el, orientation) {
            var me = this,
                o = orientation || me.opts.orientation,
                position = $el.position(),
                slide = (o === 'vertical') ? position.top : position.left;

            me.slide(slide);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/slideToElement', me);

            $.publish('plugin/swProductSlider/onSlideToElement', [me, $el, orientation]);
        },

        /**
         * Does the slide animation to the given position.
         *
         * @public
         * @method slide
         * @param {Number} position
         */
        slide: function (position) {
            var me = this,
                animation = {};

            me.isAnimating = true;

            animation[(me.opts.orientation === 'vertical') ? 'scrollTop' : 'scrollLeft'] = position;

            me.$container.stop().animate(animation, me.opts.animationSpeed, 'easeOutExpo', function () {
                me.currentPosition = me.getScrollPosition();
                me.isAnimating = false;

                $.publish('plugin/swProductSlider/onSlideFinished', [me, me.currentPosition]);
            });

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/slide', me);

            $.publish('plugin/swProductSlider/onSlide', [me, position]);
        },

        /**
         * Handles the automatic sliding.
         *
         * @public
         * @method autoSlide
         * @param {String} slideDirection
         * @param {Number} slideSpeed
         */
        autoSlide: function (slideDirection, slideSpeed) {
            var me = this,
                direction = slideDirection || me.opts.autoSlideDirection,
                speed = slideSpeed || me.opts.autoSlideSpeed,
                method = (direction === 'prev') ? me.slidePrev : me.slideNext;

            me.autoSlideAnimation = window.setInterval($.proxy(method, me), speed * 1000);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/autoSlide', me);

            $.publish('plugin/swProductSlider/onAutoSlide', [me, me.autoSlideAnimation, slideDirection, slideSpeed]);
        },

        /**
         * Stops the automatic sliding.
         *
         * @public
         * @method stopAutoSlide
         */
        stopAutoSlide: function () {
            var me = this;

            window.clearInterval(me.autoSlideAnimation);
            me.autoSlideAnimation = false;

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/stopAutoSlide', me);

            $.publish('plugin/swProductSlider/onStopAutoSlide', me);
        },

        /**
         * Scrolls the slider forward by the given distance.
         *
         * @public
         * @method scrollNext
         * @param {Number} scrollDistance
         */
        scrollNext: function (scrollDistance) {
            var me = this;

            me.currentPosition += scrollDistance || me.opts.scrollDistance;

            me.slide(me.currentPosition);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/scrollNext', me);

            $.publish('plugin/swProductSlider/onScrollNext', [me, me.currentPosition, scrollDistance]);
        },

        /**
         * Scrolls the slider backwards by the given distance.
         *
         * @public
         * @method scrollPrev
         * @param {Number} scrollDistance
         */
        scrollPrev: function (scrollDistance) {
            var me = this;

            me.currentPosition -= scrollDistance || me.opts.scrollDistance;

            me.slide(me.currentPosition);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/scrollPrev', me);

            $.publish('plugin/swProductSlider/onScrollPrev', [me, me.currentPosition, scrollDistance]);
        },

        /**
         * Handles the automatic scrolling of the slider.
         *
         * @public
         * @method autoScroll
         * @param {String} scrollDirection
         * @param {Number} scrollSpeed
         */
        autoScroll: function (scrollDirection, scrollSpeed) {
            var me = this,
                direction = scrollDirection || me.opts.autoScrollDirection,
                speed = scrollSpeed || me.opts.autoScrollSpeed,
                position = me.getScrollPosition();

            me.autoScrollAnimation = requestAnimationFrame($.proxy(me.autoScroll, me, direction, speed));

            me.setPosition((direction === 'prev') ? position - speed : position + speed);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/autoScroll', me);

            $.publish('plugin/swProductSlider/onAutoScroll', [me, me.autoScrollAnimation, scrollDirection, scrollSpeed]);
        },

        /**
         * Stops the automatic scrolling.
         *
         * @public
         * @method stopAutoScroll
         */
        stopAutoScroll: function () {
            var me = this;

            cancelAnimationFrame(me.autoScrollAnimation);
            me.autoScrollAnimation = false;

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/stopAutoScroll', me);

            $.publish('plugin/swProductSlider/onStopAutoScroll', me);
        },

        /**
         * Buffers the calling of a function.
         *
         * @param func
         * @param bufferTime
         */
        buffer: function(func, bufferTime) {
            var me = this;

            window.clearTimeout(me.bufferedCall);

            me.bufferedCall = window.setTimeout($.proxy(func, me), bufferTime);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/productSlider/buffer', me);

            $.publish('plugin/swProductSlider/onBuffer', [me, me.bufferedCall, func, bufferTime]);
        },

        /**
         * Destroys the plugin and all necessary settings.
         *
         * @public
         * @method destroy
         */
        destroy: function () {
            var me = this;

            if (me.$arrowPrev) me.$arrowPrev.remove();
            if (me.$arrowNext) me.$arrowNext.remove();

            me.stopAutoSlide();
            me.stopAutoScroll();

            me._destroy();
        }
    });
})(jQuery, window);