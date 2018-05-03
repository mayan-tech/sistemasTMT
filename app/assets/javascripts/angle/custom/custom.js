// Custom jQuery
// -----------------------------------


(function(window, document, $, undefined){

  $(function(){

    // document ready
    // document ready

  $('.loginform').css('opacity',0.70);

  var slide =  new Array(
                   '/assets/angle/slider-tickets/images4-8e9c54edd454ef869d29611cb91fe54312c920285d882a33767595e9784057ff.jpg',
                   '/assets/angle/slider-tickets/images2-149bffe12ca1494b035eb4513e3c0aa4a2a8083546ed3a17ca839516c9694468.jpg',
                   '/assets/angle/slider-tickets/images4-8e9c54edd454ef869d29611cb91fe54312c920285d882a33767595e9784057ff.jpg',
                   '/assets/angle/slider-tickets/images3-91052b0d4f2555dc0896623f4dc4adc064f78f3456cf00f8d6470310e0a565c3.jpg'
                    );


var nextimage = 0;
doSlideshow();
function doSlideshow(){
  if(nextimage>= slide.lenght){ nextimage = 0;}
  $('.loginS')
  .css('background-image','url("'+slide[nextimage++]+'")');
  /*.fadeIn(6000,function(){
      setTimeout(doSlideshow,10000);
  });*/
}

  });

})(window, document, window.jQuery);
