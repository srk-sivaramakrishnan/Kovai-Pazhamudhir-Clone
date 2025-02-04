(function (factory) {
	factory((typeof module === 'object' && typeof module.exports === 'object') ? require('jquery') : jQuery, window, document)
}(function ($, window, document) {
	'use strict';
	var $activityObject = $('<div/>').attr('class', 'imagelightbox-loading').append($('<div/>')),
		$arrowLeftObject = $('<button/>', {
			type: 'button',
			class: 'imagelightbox-arrow imagelightbox-arrow-left'
		}),
		$arrowRightObject = $('<button/>', {
			type: 'button',
			class: 'imagelightbox-arrow imagelightbox-arrow-right'
		}),
		$arrows = $arrowLeftObject.add($arrowRightObject),
		$captionObject = $('<div/>', {
			class: 'imagelightbox-caption',
			html: ' '
		}),
		$buttonObject = $('<button/>', {
			type: 'button',
			class: 'imagelightbox-close'
		}),
		$overlayObject = $('<div/>', {
			class: 'imagelightbox-overlay'
		}),
		$navItem = $('<a/>', {
			href: '#',
			class: 'imagelightbox-navitem'
		}),
		$navObject = $('<div/>', {
			class: 'imagelightbox-nav'
		}),
		$wrapper = $('<div/>', {
			class: 'imagelightbox-wrapper'
		}),
		$body = $('body');
	var cssTransitionSupport = function () {
			var s = document.body || document.documentElement;
			s = s.style;
			if (s.transition === '') {
				return ''
			}
			if (s.WebkitTransition === '') {
				return '-webkit-'
			}
			if (s.MozTransition === '') {
				return '-moz-'
			}
			if (s.OTransition === '') {
				return '-o-'
			}
			return !1
		},
		hasCssTransitionSupport = cssTransitionSupport() !== !1,
		cssTransitionTranslateX = function (element, positionX, speed) {
			var options = {},
				prefix = cssTransitionSupport();
			options[prefix + 'transform'] = 'translateX(' + positionX + ') translateY(-50%)';
			options[prefix + 'transition'] = prefix + 'transform ' + speed + 's ease-in';
			element.css(options)
		},
		hasTouch = ('ontouchstart' in window),
		hasPointers = window.navigator.pointerEnabled || window.navigator.msPointerEnabled,
		wasTouched = function (event) {
			if (hasTouch) {
				return !0
			}
			if (!hasPointers || typeof event === 'undefined' || typeof event.pointerType === 'undefined') {
				return !1
			}
			if (typeof event.MSPOINTER_TYPE_MOUSE !== 'undefined') {
				if (event.MSPOINTER_TYPE_MOUSE !== event.pointerType) {
					return !0
				}
			} else if (event.pointerType !== 'mouse') {
				return !0
			}
			return !1
		},
		hasFullscreenSupport = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled),
		hasHistorySupport = !!(window.history && history.pushState);
	$.fn.imageLightbox = function (opts) {
		var targetSet = '',
			targets = $([]),
			target = $(),
			videos = $([]),
			targetIndex = -1,
			image = $(),
			swipeDiff = 0,
			inProgress = !1,
			currentIndex = 0,
			options = $.extend({
				selector: 'a[data-imagelightbox]',
				id: 'imagelightbox',
				allowedTypes: 'png|jpg|jpeg|gif',
				animationSpeed: 250,
				activity: !1,
				arrows: !1,
				button: !1,
				caption: !1,
				enableKeyboard: !0,
				history: !1,
				fullscreen: !1,
				gutter: 10,
				offsetY: 0,
				navigation: !1,
				overlay: !1,
				preloadNext: !0,
				quitOnEnd: !1,
				quitOnImgClick: !1,
				quitOnDocClick: !0,
				quitOnEscKey: !0
			}, opts),
			_onStart = function () {
				if (options.arrows) {
					arrowsOn(this)
				}
				if (options.navigation) {
					navigationOn()
				}
				if (options.overlay) {
					overlayOn()
				}
				if (options.button) {
					closeButtonOn()
				}
				if (options.caption) {
					$wrapper.append($captionObject)
				}
			},
			_onLoadStart = function () {
				if (options.activity) {
					activityIndicatorOn()
				}
				if (options.caption) {
					captionReset()
				}
			},
			_onLoadEnd = function () {
				if (options.activity) {
					activityIndicatorOff()
				}
				if (options.arrows) {
					$arrows.css('display', 'block')
				}
			},
			_addQueryField = function (query, key, value) {
				var newField = key + '=' + value;
				var newQuery = '?' + newField;
				if (query) {
					var keyRegex = new RegExp('([?&])' + key + '=[^&]*');
					if (query.match(keyRegex) !== null) {
						newQuery = query.replace(keyRegex, '$1' + newField)
					} else {
						newQuery = query + '&' + newField
					}
				}
				return newQuery
			},
			_pushToHistory = function () {
				if (!hasHistorySupport || !options.history) {
					return
				}
				var newIndex = targets[targetIndex].dataset.ilb2Id;
				if (!newIndex) {
					newIndex = targetIndex
				}
				var newState = {
					imageLightboxIndex: newIndex
				};
				var set = targets[targetIndex].dataset.imagelightbox;
				if (set) {
					newState.imageLightboxSet = set
				}
				var newQuery = _addQueryField(document.location.search, 'imageLightboxIndex', newIndex);
				if (set) {
					newQuery = _addQueryField(newQuery, 'imageLightboxSet', set)
				}
				window.history.pushState(newState, '', document.location.pathname + newQuery)
			},
			_removeQueryField = function (query, key) {
				var newQuery = query;
				if (newQuery) {
					var keyRegex1 = new RegExp('\\?' + key + '=[^&]*');
					var keyRegex2 = new RegExp('&' + key + '=[^&]*');
					newQuery = newQuery.replace(keyRegex1, '?');
					newQuery = newQuery.replace(keyRegex2, '')
				}
				return newQuery
			},
			_pushQuitToHistory = function () {
				if (!hasHistorySupport || !options.history) {
					return
				}
				var newQuery = _removeQueryField(document.location.search, 'imageLightboxIndex');
				newQuery = _removeQueryField(newQuery, 'imageLightboxSet');
				window.history.pushState({}, '', document.location.pathname + newQuery)
			},
			_getQueryField = function (key) {
				var keyValuePair = new RegExp('[?&]' + key + '(=([^&#]*)|&|#|$)').exec(document.location.search);
				if (!keyValuePair || !keyValuePair[2]) {
					return undefined
				}
				return decodeURIComponent(keyValuePair[2].replace(/\+/g, ' '))
			},
			_openHistory = function () {
				if (!hasHistorySupport || !options.history) {
					return
				}
				var id = _getQueryField('imageLightboxIndex');
				if (!id) {
					return
				}
				var element = targets.filter('[data-ilb2-id="' + id + '"]');
				if (element.length > 0) {
					targetIndex = targets.index(element)
				} else {
					targetIndex = id;
					element = $(targets[targetIndex])
				}
				var set = _getQueryField('imageLightboxSet');
				if (!element[0] || (!!set && set !== element[0].dataset.imagelightbox)) {
					return
				}
				_openImageLightbox(element, !0)
			},
			_popHistory = function (event) {
				var newState = event.originalEvent.state;
				if (!newState) {
					_quitImageLightbox(!0);
					return
				}
				var newId = newState.imageLightboxIndex;
				if (newId === undefined) {
					_quitImageLightbox(!0);
					return
				}
				var element = targets.filter('[data-ilb2-id="' + newId + '"]');
				if (element.length > 0) {
					var newIndex = targets.index(element)
				} else {
					newIndex = newId;
					element = $(targets[newIndex])
				}
				if (!element[0] || (newState.imageLightboxSet && newState.imageLightboxSet !== element[0].dataset.imagelightbox)) {
					return
				}
				if (targetIndex < 0) {
					_openImageLightbox(element, !0);
					return
				}
				var direction = +1;
				if (newIndex > targetIndex) {
					direction = -1
				}
				target = element;
				targetIndex = newIndex;
				_loadImage(direction)
			},
			_previousTarget = function () {
				targetIndex--;
				if (targetIndex < 0) {
					if (options.quitOnEnd === !0) {
						_quitImageLightbox();
						return
					} else {
						targetIndex = targets.length - 1
					}
				}
				target = targets.eq(targetIndex);
				_pushToHistory();
				$wrapper.trigger('previous.ilb2', target);
				_loadImage(+1)
			},
			_nextTarget = function () {
				targetIndex++;
				if (targetIndex >= targets.length) {
					if (options.quitOnEnd === !0) {
						_quitImageLightbox();
						return
					} else {
						targetIndex = 0
					}
				}
				_pushToHistory();
				target = targets.eq(targetIndex);
				$wrapper.trigger('next.ilb2', target);
				_loadImage(-1)
			},
			activityIndicatorOn = function () {
				$wrapper.append($activityObject)
			},
			activityIndicatorOff = function () {
				$('.imagelightbox-loading').remove()
			},
			overlayOn = function () {
				$wrapper.append($overlayObject)
			},
			closeButtonOn = function () {
				$buttonObject.appendTo($wrapper).on('click.ilb7', function () {
					_quitImageLightbox();
					return !1
				})
			},
			captionReset = function () {
				$captionObject.css('opacity', '0');
				$captionObject.html(' ');
				if ($(target).data('ilb2-caption')) {
					$captionObject.css('opacity', '1');
					$captionObject.html($(target).data('ilb2-caption'))
				} else if ($(target).find('img').attr('alt')) {
					$captionObject.css('opacity', '1');
					$captionObject.html($(target).find('img').attr('alt'))
				}
			},
			navigationOn = function () {
				if (!targets.length) {
					return
				}
				for (var i = 0; i < targets.length; i++) {
					$navObject.append($navItem.clone())
				}
				var $navItems = $navObject.children('a');
				$navItems.eq(targets.index(target)).addClass('active');
				$wrapper.on('previous.ilb2 next.ilb2', function () {
					$navItems.removeClass('active').eq(targets.index(target)).addClass('active')
				});
				$wrapper.append($navObject);
				$navObject.on('click.ilb7 touchend.ilb7', function () {
					return !1
				}).on('click.ilb7 touchend.ilb7', 'a', function () {
					var $this = $(this);
					if (targets.eq($this.index()).attr('href') !== $('.imagelightbox').attr('src')) {
						var tmpTarget = targets.eq($this.index());
						if (tmpTarget.length) {
							currentIndex = targets.index(target);
							target = tmpTarget;
							_loadImage($this.index() < currentIndex ? -1 : 1)
						}
					}
					$this.addClass('active').siblings().removeClass('active')
				})
			},
			arrowsOn = function () {
				$wrapper.append($arrows);
				$arrows.on('click.ilb7 touchend.ilb7', function (e) {
					e.stopImmediatePropagation();
					e.preventDefault();
					if ($(this).hasClass('imagelightbox-arrow-left')) {
						_previousTarget()
					} else {
						_nextTarget()
					}
					return !1
				})
			},
			isTargetValid = function (element) {
				return $(element).prop('tagName').toLowerCase() === 'a' && ((new RegExp('\.(' + options.allowedTypes + ')$', 'i')).test($(element).attr('href')) || $(element).data('ilb2Video'))
			},
			_setImage = function () {
				if (!image.length) {
					return !0
				}
				var captionHeight = options.caption ? $captionObject.outerHeight() : 0,
					screenWidth = $(window).width(),
					screenHeight = $(window).height() - captionHeight,
					gutterFactor = Math.abs(1 - options.gutter / 100);

				function setSizes(imageWidth, imageHeight) {
					if (imageWidth > screenWidth || imageHeight > screenHeight) {
						var ratio = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
						imageWidth /= ratio;
						imageHeight /= ratio
					}
					var cssHeight = imageHeight * gutterFactor,
						cssWidth = imageWidth * gutterFactor,
						cssLeft = ($(window).width() - cssWidth) / 2;
					image.css({
						'width': cssWidth + 'px',
						'height': cssHeight + 'px',
						'left': cssLeft + 'px'
					})
				}
				if (image.get(0).videoWidth !== undefined) {
					setSizes(image.get(0).videoWidth, image.get(0).videoHeight);
					return
				}
				var tmpImage = new Image();
				tmpImage.src = image.attr('src');
				tmpImage.onload = function () {
					setSizes(tmpImage.width, tmpImage.height)
				}
			},
			_loadImage = function (direction) {
				if (inProgress) {
					return !1
				}
				if (image.length) {
					var params = {
						'opacity': 0
					};
					if (hasCssTransitionSupport) {
						cssTransitionTranslateX(image, (100 * direction) - swipeDiff + 'px', options.animationSpeed / 1000)
					} else {
						params.left = parseInt(image.css('left')) + (100 * direction) + 'px'
					}
					image.animate(params, options.animationSpeed, function () {
						_removeImage()
					});
					swipeDiff = 0
				}
				inProgress = !0;
				_onLoadStart();
				setTimeout(function () {
					var imgPath = target.attr('href'),
						swipeStart = 0,
						swipeEnd = 0,
						imagePosLeft = 0;
					var videoOptions = target.data('ilb2Video');
					var preloadedVideo, element;
					if (videoOptions) {
						videos.each(function () {
							if (this.i === target.data('ilb2VideoId')) {
								preloadedVideo = this.l;
								element = this.e;
								if (this.a) {
									if (preloadedVideo === !1) {
										element.attr('autoplay', this.a)
									}
									if (preloadedVideo === !0) {
										element.get(0).play()
									}
								}
							}
						})
					} else {
						element = $('<img id=\'' + options.id + '\' />').attr('src', imgPath)
					}

					function onload() {
						var params = {
							'opacity': 1
						};
						image.appendTo($wrapper);
						_setImage();
						image.css('opacity', 0);
						if (hasCssTransitionSupport) {
							cssTransitionTranslateX(image, -100 * direction + 'px', 0);
							setTimeout(function () {
								cssTransitionTranslateX(image, 0 + 'px', options.animationSpeed / 1000)
							}, 50)
						} else {
							var imagePosLeft = parseInt(image.css('left'));
							params.left = imagePosLeft + 'px';
							image.css('left', imagePosLeft - 100 * direction + 'px')
						}
						image.animate(params, options.animationSpeed, function () {
							inProgress = !1;
							_onLoadEnd()
						});
						if (options.preloadNext) {
							var nextTarget = targets.eq(targets.index(target) + 1);
							if (!nextTarget.length) {
								nextTarget = targets.eq(0)
							}
							$('<img />').attr('src', nextTarget.attr('href'))
						}
						$wrapper.trigger('loaded.ilb2')
					}

					function onclick(e) {
						e.preventDefault();
						if (options.quitOnImgClick) {
							_quitImageLightbox();
							return !1
						}
						if (wasTouched(e.originalEvent)) {
							return !0
						}
						var posX = (e.pageX || e.originalEvent.pageX) - e.target.offsetLeft;
						if (e.target.width / 2 > posX) {
							_previousTarget()
						} else {
							_nextTarget()
						}
					}
					image = element.on('load.ilb7', onload).on('error.ilb7', function () {
						_onLoadEnd()
					}).on('touchstart.ilb7 pointerdown.ilb7 MSPointerDown.ilb7', function (e) {
						if (!wasTouched(e.originalEvent) || options.quitOnImgClick) {
							return !0
						}
						if (hasCssTransitionSupport) {
							imagePosLeft = parseInt(image.css('left'))
						}
						swipeStart = e.originalEvent.pageX || e.originalEvent.touches[0].pageX
					}).on('touchmove.ilb7 pointermove.ilb7 MSPointerMove.ilb7', function (e) {
						if ((!hasPointers && e.type === 'pointermove') || !wasTouched(e.originalEvent) || options.quitOnImgClick) {
							return !0
						}
						e.preventDefault();
						swipeEnd = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
						swipeDiff = swipeStart - swipeEnd;
						if (hasCssTransitionSupport) {
							cssTransitionTranslateX(image, -swipeDiff + 'px', 0)
						} else {
							image.css('left', imagePosLeft - swipeDiff + 'px')
						}
					}).on('touchend.ilb7 touchcancel.ilb7 pointerup.ilb7 pointercancel.ilb7 MSPointerUp.ilb7 MSPointerCancel.ilb7', function (e) {
						if (!wasTouched(e.originalEvent) || options.quitOnImgClick) {
							return !0
						}
						if (Math.abs(swipeDiff) > 50) {
							if (swipeDiff < 0) {
								_previousTarget()
							} else {
								_nextTarget()
							}
						} else {
							if (hasCssTransitionSupport) {
								cssTransitionTranslateX(image, 0 + 'px', options.animationSpeed / 1000)
							} else {
								image.animate({
									'left': imagePosLeft + 'px'
								}, options.animationSpeed / 2)
							}
						}
					});
					if (preloadedVideo === !0) {
						onload()
					}
					if (preloadedVideo === !1) {
						image = image.on('loadedmetadata.ilb7', onload)
					}
					if (!videoOptions) {
						image = image.on(hasPointers ? 'pointerup.ilb7 MSPointerUp.ilb7' : 'click.ilb7', onclick)
					}
				}, options.animationSpeed + 100)
			},
			_removeImage = function () {
				if (!image.length) {
					return !1
				}
				image.remove();
				image = $()
			},
			_openImageLightbox = function ($target, noHistory) {
				if (inProgress) {
					return !1
				}
				inProgress = !1;
				target = $target;
				targetIndex = targets.index(target);
				if (!noHistory) {
					_pushToHistory()
				}
				_onStart();
				$body.append($wrapper).addClass('imagelightbox-open');
				$wrapper.trigger('start.ilb2', $target);
				_loadImage(0)
			},
			_quitImageLightbox = function (noHistory) {
				targetIndex = -1;
				if (!noHistory) {
					_pushQuitToHistory()
				}
				$wrapper.trigger('quit.ilb2');
				$body.removeClass('imagelightbox-open');
				if (!image.length) {
					return !1
				}
				image.animate({
					'opacity': 0
				}, options.animationSpeed, function () {
					_removeImage();
					inProgress = !1;
					$wrapper.remove().find('*').remove()
				})
			},
			_addTargets = function (newTargets) {
				newTargets.each(function () {
					targets = newTargets.add($(this))
				});
				newTargets.on('click.ilb7', {
					set: targetSet
				}, function (e) {
					e.preventDefault();
					targetSet = $(e.currentTarget).data('imagelightbox');
					filterTargets();
					if (targets.length < 1) {
						_quitImageLightbox()
					} else {
						_openImageLightbox($(this))
					}
				});

				function filterTargets() {
					newTargets.filter(function () {
						return $(this).data('imagelightbox') === targetSet
					}).filter(function () {
						return isTargetValid($(this))
					}).each(function () {
						targets = targets.add($(this))
					})
				}
			},
			_preloadVideos = function (elements) {
				elements.each(function () {
					var videoOptions = $(this).data('ilb2Video');
					if (videoOptions) {
						var id = $(this).data('ilb2Id');
						if (!id) {
							id = 'a' + (((1 + Math.random()) * 0x10000) | 0).toString(16)
						}
						$(this).data('ilb2VideoId', id);
						var container = {
							e: $('<video id=\'' + options.id + '\' preload=\'metadata\'>'),
							i: id,
							l: !1,
							a: undefined
						};
						$.each(videoOptions, function (key, value) {
							if (key === 'autoplay') {
								container.a = value
							} else if (key !== 'sources') {
								container.e = container.e.attr(key, value)
							}
						});
						if (videoOptions.sources) {
							$.each(videoOptions.sources, function (_, source) {
								var sourceElement = $('<source>');
								$.each(source, function (key, value) {
									sourceElement = sourceElement.attr(key, value)
								});
								container.e.append(sourceElement)
							})
						}
						container.e.on('loadedmetadata.ilb7', function () {
							container.l = !0
						});
						videos = videos.add(container)
					}
				})
			};
		$(window).on('resize.ilb7', _setImage);
		if (hasHistorySupport && options.history) {
			$(window).on('popstate', _popHistory)
		}
		$(document).ready(function () {
			if (options.quitOnDocClick) {
				$(document).on(hasTouch ? 'touchend.ilb7' : 'click.ilb7', function (e) {
					if (image.length && !$(e.target).is(image)) {
						e.preventDefault();
						_quitImageLightbox()
					}
				})
			}
			if (options.fullscreen && hasFullscreenSupport) {
				$(document).on('keydown.ilb7', function (e) {
					if (!image.length) {
						return !0
					}
					if ([9, 32, 38, 40].indexOf(e.which) > -1) {
						e.stopPropagation();
						e.preventDefault()
					}
					if ([13].indexOf(e.which) > -1) {
						e.stopPropagation();
						e.preventDefault();
						toggleFullScreen()
					}
				})
			}
			if (options.enableKeyboard) {
				$(document).on('keydown.ilb7', function (e) {
					if (!image.length) {
						return !0
					}
					if ([27].indexOf(e.which) > -1 && options.quitOnEscKey) {
						e.stopPropagation();
						e.preventDefault();
						_quitImageLightbox()
					}
					if ([37].indexOf(e.which) > -1) {
						e.stopPropagation();
						e.preventDefault();
						_previousTarget()
					}
					if ([39].indexOf(e.which) > -1) {
						e.stopPropagation();
						e.preventDefault();
						_nextTarget()
					}
				})
			}
		});

		function toggleFullScreen() {
			var doc = window.document;
			var docEl = document.getElementById(options.id).parentElement;
			var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
			var exitFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
			if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
				requestFullScreen.call(docEl)
			} else {
				exitFullScreen.call(doc)
			}
		}
		$(document).off('click', options.selector);
		_addTargets($(this));
		_openHistory();
		_preloadVideos(targets);
		this.addToImageLightbox = function (elements) {
			_addTargets(elements);
			_preloadVideos(elements)
		};
		this.openHistory = function () {
			_openHistory()
		};
		this.loadPreviousImage = function () {
			_previousTarget()
		};
		this.loadNextImage = function () {
			_nextTarget()
		};
		this.quitImageLightbox = function () {
			_quitImageLightbox();
			return this
		};
		this.startImageLightbox = function (element) {
			if (element)
				element.trigger('click.ilb7');
			else $(this).trigger('click.ilb7')
		};
		return this
	}
}))