var wzd = function($){
      return{
            container:{},
            steps:[],
            groups:[],
            stepMarkup:{},
            active: {
                  "group":{"number":0,"id":"","title":""},
                  "step":{"number":0,"id":"","title":""},
                  "deploy":{"id":"","title":""}
            },
            stepObserved: true,
            stepBegin:0,
            button :{
                  "p" : "#btn-prev",
                  "n" : "#btn-next"
            },
            stepGoto:0,
            stepPrevOnSeen: true,
            init:function( conf ){
                  wzd.container = $(conf.container);
                  wzd.steps = conf.steps;
                  wzd.groups = conf.groups;
                  if(conf.stepBegin != undefined){
                        wzd.stepBegin = conf.stepBegin;
                  }
                  if(conf.stepPrevOnSeen != undefined){
                        wzd.stepPrevOnSeen = conf.stepPrevOnSeen;
                  }
                  wzd.stepMarkup = $(".step");
                  wzd.start();
            },
            start:function(){
                  if(wzd.stepMarkup.length != wzd.steps.length){
                        msg("La cantidad de 'steps' en el HTML no es igual a la cantidad de 'steps' en el json inicial");
                  }else{
                        var errMarkup = 0;
                        $.each(wzd.stepMarkup,function(i,e){
                              if(wzd.steps[i].fullscreen){
                                    if($(this).data("fullscreen") != true){
                                          errMarkup++;
                                    }
                              }
                        });
                        if(errMarkup != 0){
                              msg("Los atributos 'fullscreen' no están distribuidos correctamente en el html");
                        }else{
                              msg("ok");
                                           
                              wzd.buildStatus(wzd.stepBegin,function(){
                                    wzd.renderUI();
                              });
                        } 
                  }
            },
            // Order activity
            buildStatus: function( step , c ){
                  if( step >= wzd.steps.length ){
                        msg("El paso "+step+" no existe");
                  }else{
                        for (var i = 0; i < wzd.steps.length; i++) {

                              if( i > step ){
                                    // Set the nexts steps and groups inactive (active = false)
                                    msg("Paso "+i+" UNSEEN");
                                    wzd.groups[wzd.steps[i].group].active = false;
                                    wzd.groups[wzd.steps[i].group].completed = false;
                                    wzd.steps[i].active = false;
                                    wzd.steps[i].completed = false;
                                    wzd.steps[i].seen = false;
                                   
                              }else{
                                    if( i == step ){
                                          // Set the current step and group active
                                          msg("Paso "+i+" SEEN");
                                          wzd.groups[wzd.steps[i].group].active = true;
                                          wzd.groups[wzd.steps[i].group].completed = false;
                                          wzd.steps[i].active = true;
                                          wzd.steps[i].completed = false;
                                          wzd.steps[i].seen = true;
                                          
                                    }else{
                                          // Set steps and groups completed
                                          //msg("Paso "+i+" completado");
                                          msg("Paso "+i+" UNSEEN");
                                          wzd.steps[i].active = false;
                                          wzd.steps[i].completed = true;
                                          wzd.groups[wzd.steps[i].group].active = false;
                                          wzd.groups[wzd.steps[i].group].completed = true;
                                          wzd.steps[i].seen = false;
                                    }
                              }
                              // Save reference to last item iterated of the group
                              wzd.groups[wzd.steps[i].group].last = wzd.steps[i].number;
                        }
                        if( c != undefined ){
                              c();
                        }
                  }    
            },
            // Render activities
            renderUI: function(){
                  var   $UI="";
                  $UI = '<div class="wizard loading blue">\
                              <div class="content">\
                                    <div class="steps-container">\
                                          <div class="steps-wrapper">\
                                                <div class="groups">\
                                                </div>\
                                                <div class="steps">\
                                                </div>\
                                          </div>\
                                    </div>\
                                    <div class="deploy-container">\
                                    </div>\
                              </div>\
                              <div id="loader-wrapper" class="animated fadeIn">\
                                    <div class="loader-content">\
                                          <div class="loader-text">Espere un momento por favor</div>\
                                    </div>\
                              </div>\
                              <div id="progress-wrapper">\
                                    <div class="progress">\
                                          <div class="indeterminate"></div>\
                                    </div>\
                              </div>\
                              <div class="main-navigation-container">\
                              </div>\
                        </div>';
                  // Add all created html to container
                  wzd.container.html($UI);
                  $(".groups").html( wzd.renderGroups() );
                  $(".steps").html( wzd.renderSteps() );
                  $(".deploy-container").html( wzd.renderDeploys() );
                  $(".main-navigation-container").html( wzd.renderMainNavigation() );
                  // Play an initia animation
                  wzd.initAnimate();
                  setTimeout(function () { 
                        // Call prev function if the current step has any, then set step to active
                        wzd.verifyCallback( 0 , function(){
                              wzd.setStep( wzd.active.step.number ,true);
                        });
                  }, 200);
                  // Create function to navigate
                  wzd.manageNavigation();
                  $("[rel='tooltip']").tooltip();
            },
            renderGroups: function (){
                  //Create groups's html and save the active one
                  var   $groupsMarkup="",
                        $completed="",
                        $id,
                        $goto;
                  for (var i = 0; i < wzd.groups.length; i++) {
                        if(wzd.groups[i].completed){
                              $completed = "completed";
                        }else{
                              $completed = "";
                        }
                        $id = "g-"+wzd.groups[i].number;
                        wzd.groups[i].id = $id;

                        $goto = wzd.groups[i].last;
                        $groupsMarkup +='<div class="group '+$completed+'" id="'+$id+'" rel="tooltip" data-toggle="tooltip" data-placement="top" title="Regresar a este punto">\
                                          <a href="#" class="goto" data-step="'+$goto+'">\
                                                <span class="init-ani" data-order="0" data-animated="bounceIn">'+wzd.groups[i].text+'</span>\
                                          </a>\
                                          <span class="check init-ani" data-order="1" data-animated="bounceIn">\
                                                <i class="fa fa-check"></i>\
                                          </span>\
                                    </div>';
                        if(wzd.groups[i].active){
                              wzd.setGroupActive(wzd.groups[i]);
                        }
                  };
                  return $groupsMarkup;
            },
            renderSteps : function(){
                  //Create step's html and save the active one
                  var   $stepsMarkup="",
                        $gstepMarkup="",
                        $completed="",
                        $gsid,
                        $sid;

                  for (var i = 0; i < wzd.groups.length; i++) {
                        
                        $gsid = "gs-"+wzd.groups[i].number;
                        $stepsMarkup +='   <ul class="gstep" id="'+$gsid+'" data-order="2" data-animated="fadeIn">';
                        for (var j = 0; j < wzd.steps.length; j++) {
                              if(wzd.groups[i].number == wzd.steps[j].group){
                                    if(wzd.steps[j].completed){
                                          $completed = "completed";
                                    }else{
                                          $completed = "";
                                    }

                                    $sid = "s-"+wzd.steps[j].number;
                                    wzd.steps[j].sid = $sid;
                                    wzd.steps[j].gsid = $gsid;
                                    $stepsMarkup +='<li class="'+$completed+'" id="'+$sid+'" data-order="2" data-animated="fadeIn">\
                                                      <a href="#" class="goto" data-step="'+j+'" rel="tooltip" data-toggle="tooltip" data-placement="top" title="Regresar a este paso">\
                                                            <span class="step-number"></span>\
                                                            <span class="step-title">'+wzd.steps[j].title+'</span>\
                                                      </a>\
                                                </li>'; 
                                    if(wzd.steps[j].active){
                                          wzd.setStepActive(wzd.steps[j]);
                                    }
                              }
                        }             
                        $stepsMarkup +='</ul>';
                  };

                  $gstepMarkup+=  '<div class="group-title">\
                                          <span class="init-ani group-title-wrapper" data-order="2" data-animated="fadeIn">\
                                                <span class="display-table">\
                                                      <span class="vertical" id="group-title-text">\
                                                      '+wzd.active.group.title+'\
                                                      </span>\
                                                </span>\
                                          </span>\
                                   </div>\
                                   <div class="group-steps">'+$stepsMarkup+'\
                                   </div>'
                  return $gstepMarkup;
            },
            renderDeploys: function(){
                  //Create deploy's(content) html and save the active one
                  var   $deploysMarkup="",
                        $completed,
                        $innerStepMarkup,
                        $dwid;
                  $.each(wzd.stepMarkup,function(i,e){

                        $innerStepMarkup = $(this).html();
                        $dwid = "dw-"+wzd.steps[i].number;
                        wzd.steps[i].dwid = $dwid;
                        $deploysMarkup += '<div class="deploy-wrapper" id="'+$dwid+'" data-order="4" data-animated="fadeIn">\
                                                '+$innerStepMarkup+'\
                                          </div>';
                        if(wzd.steps[i].active){
                              wzd.setDeployActive(wzd.steps[i]);
                        }  
                  });
                  return $deploysMarkup;
            },
            renderMainNavigation:function(){
                  //Create buttons's html
                  var $mainNavigation="";
                  $mainNavigation = '<div class="pull-right">\
                                          <button  class="btn btn-xs btn-default disabled" id="btn-prev" disabled><i class="fa fa-chevron-left"></i> Atrás</button>\
                                          <button  class="btn btn-xs btn-success disabled" id="btn-next" disabled> <span class="btn-next-text">Siguiente</span> <i class="fa fa-chevron-right"></i></button>\
                                    </div>';
                  return $mainNavigation;
            },
            // Post render activities
            initAnimate : function(){
                  //For animating some items at the begining
                  $.each($(".init-ani,.gstep,.deploy-wrapper"),function(i,e){
                        var $this = $(this);
                        var animate = true;
                        //Rulers
                        if($this.hasClass("check")){
                              if (!$this.parents('.complete').length) {
                                    animate = false;
                              }
                        }
                        if($this.hasClass("gstep")){
                              if(!$this.hasClass("active")){
                                    animate = false;
                              }
                        }
                        if($this.hasClass("deploy-wrapper")){
                              if(!$this.hasClass("active")){
                                    animate = false;
                              }
                        }
                        wzd.setAnimate( $this , animate );
                  });   
            },
            setAnimate : function(e,a,c){
                  // Play animation of elements
                  var animation = e.data("animated");
                  var order = parseInt(e.data("order"));
                  if(a){
                        setTimeout(function () {
                              e.addClass('animated '+animation);
                              if(c != undefined){
                                    c();
                              }
                        }, order*100
                              
                        );  
                  }else{
                        e.addClass('animated '+animation);
                  } 
            },
            setActive: function(e){
                  // Set an item to active
                  if(!e.hasClass("active")){
                        e.addClass("active");
                  }
            },
            setCompleted: function(e){
                  // Set an item to completed
                  if(!e.hasClass("completed")){
                        e.addClass("completed");
                  }
            },
            setGroupTitle: function(title){
                  // Set title to the group
                  $("#group-title-text").html(title);
                  return true;
            },
            renderActives: function(groupChange,c){
                  // Show the current active items ( group,subgroup,step,deploy )

                  //Groups
                  var gid = $("#"+wzd.active.group.id);
                  //Subgroups
                  var gsid = $("#"+wzd.active.step.gsid);
                  //Steps
                  var sid = $("#"+wzd.active.step.sid);
                  //Deploys
                  var dwid = $("#"+wzd.active.deploy.id);

                  // If group changes , play animation
                  if(groupChange != undefined && groupChange == true){
                        $(".groups .active").removeClass("active");
                        $(".gstep.active").removeClass("active");
                        
                        wzd.setAnimate(gid,true,function(){
                              wzd.setActive(gid);
                        });
                        wzd.setAnimate(gsid,true,function(){
                              wzd.setActive(gsid);
                        });
                  }

                  // Take all active items and remove active class
                  $(".gstep li.active").removeClass("active");
                  $(".deploy-container .active").removeClass("active");
                  // Then play their animation
                  wzd.setAnimate(sid,true,function(){
                        wzd.setActive(sid);
                  });
                  wzd.setAnimate(dwid,true,function(){
                        wzd.setActive(dwid);
                  });

                  wzd.observeStep();
                  // If there's a callback, run it;
                  if(c!=undefined){
                        c();
                  }
            },
            observeStep:function(){
                  // Check if any input into the form's current step has changed
                  wzd.stepObserved = false;
                  var   $form = $("#"+wzd.active.deploy.id+' form'),
                        origForm = $form.serialize();

                  $("#"+wzd.active.deploy.id + ' form :input').on('change input', function() {
                        if($form.serialize() !== origForm){
                              wzd.stepObserved = true;
                        }else{
                              wzd.stepObserved = false;
                              if( notify.active ){
                                    wzd.manageNotify(-99);
                              }
                        }

                  });
            },
            // Set step
            setStep: function(ns , groupChange , completed){
                  // Set the given step, and decide to render changes in the html;
                  var a = wzd.active.step.number;
                  var render = true;

                  // If the next step is bigger than the current step, the action is called by the prev button or it's called from the begining
                  if( ns <= a ){
                        // If it's the first step, disable the prev button, otherwise, enable it.
                        if( ns == 0){
                              wzd.buttonChange( $(wzd.button.p) , 0 , false );
                        }else{
                              wzd.buttonChange( $(wzd.button.p) , 0 , true );
                        } 
                        // Enable the next button.
                        wzd.buttonChange( $(wzd.button.n) , 0 , true );
                  }else{
                         // Enable the next button.
                        wzd.buttonChange( $(wzd.button.p) , 0 , true );
                        // If it's the last+1 step (out of the serie) , do nothing, just disable next button, otherwise, enable it,
                        if( ns == (wzd.steps.length)){
                              msg("function de salida");
                              wzd.buttonChange( $(wzd.button.n) , 0 , false );
                              render = false;
                        }else{
                              wzd.buttonChange( $(wzd.button.n) , 0 , true );
                              completed = true;
                        }
                  }

                  // If it is gonna show the last step, change button's text
                  if( ns >= (wzd.steps.length-1)){
                        wzd.buttonChange( $(wzd.button.n) , 1 , "Terminar" );
                  }else{
                        wzd.buttonChange( $(wzd.button.n) , 1 , "Siguiente" );
                  }

                  // Set step seen
                  wzd.setStepSeen(true);

                  // If render is set to true, run function to set the next step
                  if(render){
                        // If it's not defined if the group has changed, verify if it's true or false
                        if( groupChange == undefined ){
                              groupChange = wzd.groupGonnaChange(wzd.steps[a],wzd.steps[ns]);
                        }
                        // If it's not defined if the group is completed, set it to false
                        if(completed == undefined ){
                              completed = false;
                        }
                        // If the group if completed, set it to completed
                        if(completed){
                              wzd.setCompleted($("#"+wzd.active.step.sid));
                              if(groupChange){
                                    wzd.setCompleted($("#"+wzd.active.group.id));
                              } 
                        }
                        // If the group has changed, set the new title
                        if(groupChange){
                              wzd.setGroupTitle(wzd.groups[wzd.steps[ns].group].title);
                        }
                        // Set group active
                        wzd.setGroupActive(wzd.groups[wzd.steps[ns].group]);
                        // Set group active
                        wzd.setStepActive(wzd.steps[ns]);
                        // Set group active
                        wzd.setDeployActive(wzd.steps[ns]);
                        // Show actives in html
                        wzd.renderActives( groupChange ); 
                  }
                  // Disable loader
                  wzd.manageLoader( 0 );
            },
            setGroupActive:function(g){
                  // Save data from the active group
                  wzd.active.group.number = g.number;
                  wzd.active.group.title = g.title;
                  wzd.active.group.id = g.id;
            },
            setStepActive: function(s){
                  // Save data from the step group
                  wzd.active.step.number = s.number;
                  wzd.active.step.title = s.title;
                  wzd.active.step.sid = s.sid;
                  wzd.active.step.gsid = s.gsid;
            },
            setDeployActive: function(s){
                  // Save deploy from the active group
                  wzd.active.deploy.title = s.title;
                  wzd.active.deploy.id = s.dwid;
            },
            setStepSeen: function(e){
                  // Set attribute "seen" for prevfx
                  wzd.steps[  wzd.active.step.number ].seen = e;
            },
            isStepSeen: function( n ){
                  // return value of attribute "seen" in step n
                  return wzd.steps[ n ].seen;
            },
            // Change activities
            manageNavigation: function(){
                  // When prev button (<-) is clicked
                  $(wzd.button.p).click(function(){
                        var ns = wzd.active.step.number;
                        if( (ns-1)  >= 0 ){
                              ns -= 1;
                        }
                        // If there's an active notification, just animate it; otherwise, send a notification
                        if( notify.active ){
                              notify.close();
                        }
                        wzd.manageNotify(0);

                        // If step has not been seen, run prev-callback; otherwise, setStep()
                        if( wzd.isStepSeen( ns ) == false && wzd.stepPrevOnSeen == true){
                              wzd.verifyCallback( 0 , function(){
                                    wzd.setStep(ns);
                              },ns);
                        }else{
                              // Set step
                              wzd.setStep(ns);
                        }  
                  });
                  // When next button (->) is clicked
                  $(wzd.button.n).click(function(){
                        var ns = wzd.active.step.number+1;
                        // Verify if the step has a function post-step before setting the new step
                        wzd.manageNotify(-99);
                        wzd.verifyCallback( 1 , function(){
                              wzd.setStep(ns);
                        });
                  });
                  // When numbers links are clicked directly
                  $(".goto").click(function(){

                        var ns = $(this).data("step");
                        stepGoto = ns;
                        // If it's has been a change into the current form, show a notification; send to the next step
                        if(wzd.stepObserved){
                              // If there's an active notification, just animate it; otherwise, send a notification
                              if( notify.active ){
                                    notify.animate();
                              }else{
                                    wzd.manageNotify(1);
                              }   
                        }else{
                              // If there's an active notification, just animate it; otherwise, send a notification
                              if( notify.active ){
                                    notify.animate();
                              }else{
                                    wzd.manageNotify(0);
                              }
                              // If step has not been seen, run prev-callback; otherwise, setStep()
                              if( wzd.isStepSeen( ns ) == false && wzd.stepPrevOnSeen == true){
                                    wzd.verifyCallback( 0 , function(){
                                          wzd.setStep(ns);
                                    },ns);
                              }else{
                                    // Set step
                                    wzd.setStep(ns);
                              }
                        } 
                  });
            },
            manageLoader: function(l){
                  // Set loader's status to wizard
                  switch(l){
                        case 0:
                              $(".wizard").removeClass("loading");
                        break;
                        case 1:
                              if(!$(".wizard").hasClass("loading")){
                                    $(".wizard").addClass("loading");
                              }
                        break;
                  }
            },
            groupGonnaChange:function(a,b){
                  // Compare numbers of the group
                  if(a.group != b.group){
                        return true;
                  }else{
                        return false;
                  }
            },
            buttonChange:function(b,s,v){
                  switch(s){
                        // Manage disable / enable
                        case 0:
                              if( v  == false ){
                                    b.addClass("disabled").attr("disabled",true);
                              }else{
                                    b.removeClass("disabled").attr("disabled",false);
                              } 
                        break;
                        // Manage text
                        case 1:
                              b.find(".btn-next-text").html(v);
                        break;
                  }
            },
            // Callback activities
            verifyCallback: function(btn , c , otherNumber){
                  // By default, any step has a callback
                  var gonnaCallback = false;
                  var stepNumber;
                  if( otherNumber != undefined){
                        stepNumber = otherNumber;
                  }else{
                        stepNumber = wzd.active.step.number
                  }
                  var gonnaCallback = false;
                  switch( btn ){
                        //If it's  called for prev function, verify if step has any prev function, if it's true, save its name
                        case 0:
                              if($.isFunction(window[wzd.steps[ stepNumber ].prevfx])) {
                                    gonnaCallback = wzd.steps[ stepNumber ].prevfx;
                              }
                        break;
                        //If it's  called for post function, verify if step has any post function, if it's true, save its name
                        case 1:
                              if($.isFunction(window[wzd.steps[ stepNumber ].postfx])) {
                                    gonnaCallback = wzd.steps[ stepNumber ].postfx;
                              }
                        break;
                  }
                  
                  // Disable main navigation buttons
                  wzd.buttonChange( $(wzd.button.p) , 0 , false );
                  wzd.buttonChange( $(wzd.button.n) , 0 , false );
                  //Show loader
                  wzd.manageLoader( 1 );
                  // If there's any callback's step found, run it, then play any other after callback; otherwise, just run the after callback
                  if(gonnaCallback){
                        window[gonnaCallback](function(){
                              if(c!=undefined){
                                    c();
                              }  
                        });
                  }else{
                        if(c!=undefined){
                              c();
                        }    
                  }
            },
            manageNotify:function(m){
                  // Set function to notifications
                  if(m == -99){
                        notify.close();
                  }else{
                        notify.now = m;
                        notify.setText();
                  }
            }

      }
}(jQuery);

var notify = function($){
      return{
            phrases:[],
            now:0,
            n:false,
            attentionAnimated:"bounce",
            active:false,
            init : function(phrases){
                  notify.phrases = [
                        {     "text":'Recuerda presionar <b>Siguiente</b> siempre cuando hayas agregado o editado nueva información.',
                              "time":3000},
                        {     "text":'Hemos detectado que hay cambios sin guardar.',
                              "time":1000}];
                  $.notifyDefaults({
                        allow_dismiss: false,
                        showProgressbar: false,
                        type: 'pastel-warning',
                        delay: 0,
                        mouse_over:"pause",
                        template: ' <div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0} notify-container" role="alert">' +
                                                '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
                                                '<span data-notify="icon"></span> ' +
                                                '<span data-notify="title">{1}</span> ' +
                                                '<span data-notify="message">{2}</span>' +
                                                '<a href="{3}" target="{4}" data-notify="url"></a>' +
                                          '</div>',
                        placement: {
                              align: "right",
                              from : "top"
                        },
                        z_index: 4000
                  });
                  notify.setText();

                  $(document).on("click",".notify-save",function(){
                        notify.save();
                  });
                  $(document).on("click",".notify-end",function(){
                        notify.n.close();
                  });
                  $(document).on("click",".notify-discard",function(){
                        notify.discard();
                  });

            },
            setText:function(){
                  // Choose a template for notify's message , then create it;
                  var text = notify.phrases[ notify.now ].text;
                  switch( notify.now ){
                        case 0:
                              text += "";
                        break;
                        case 1:
                              text += "<div class='notify-controls separated'>"+
                                          "<div class='pull-left'>"+
                                                "<div class='notify-label'>"+
                                                      "<b>Antes de continuar, desearia:</b>"+
                                                "</div>"+
                                          "</div>"+
                                          "<div class='pull-right'>"+
                                                "<a href='#' class='link notify-link notify-discard'>Descartar</a>"+
                                                "<span class='notify-or-separator'>ó</span>"+
                                                "<a href='#' class='btn btn-success btn-xs notify-button notify-save'>Guardar los cambios <i class='fa fa-chevron-right'></i></a>"+
                                          "</div>"+
                                          "<div class='clearfix'></div>"+
                                    "</div>";
                        break;
                        
                  }
                  // If there's any active notify , close it
                  if( notify.active ){
                       notify.close(); 
                  }

                  // Create a new notify
                  notify.n = $.notify( text );
                  notify.animate();
                  notify.active = true;

                  // If notify is 0 (default), close it in 'n' seconds
                  if( notify.now == 0){
                        setTimeout(function(){
                              notify.close();
                        },5000);
                  }
            },
            discard:function(){
                  // If notify send action to "Discard", just go to selected step
                  wzd.setStep(stepGoto);
                  notify.close();
            },
            save:function(){
                  // If notify send action to "Save changes" verify callback
                  $(".notify-save").attr("disabled",true).addClass("disabled");
                  $(".notify-discard").attr("disabled",true).addClass("disabled");
                  wzd.verifyCallback( 1 , function(){
                        if( wzd.isStepSeen( stepGoto ) == false && wzd.prevOnSeen == true){
                              notify.close();
                              wzd.verifyCallback( 0 , function(){
                                    wzd.setStep(stepGoto);
                              },stepGoto);
                        }else{
                              // Set step
                              wzd.setStep(stepGoto);
                              notify.close();
                        }
                        notify.close();
                  });
            },
            close:function(){
                  //Set notify active to false and close it;
                  notify.active = false;
                  notify.n.close();
            },
            animate:function(){
                  // Animate notify when is active
                  var $n = $(".notify-container");
                  if($n.hasClass("fadeInDown")){
                        $n.removeClass("fadeInDown");
                  }
                  if($n.hasClass(notify.attentionAnimated)){
                        $n.removeClass(notify.attentionAnimated);
                  }
                  setTimeout(function(){
                        $n.addClass("animated "+notify.attentionAnimated);
                  },50);
            }
      }
}(jQuery);

function msg(msg){
      console.log(msg);
      return false;
}


