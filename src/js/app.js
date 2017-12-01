var Favourite = function(data){
    this.dish_id = data.dish_id,
    this.dish_name = data.dish_name;
    this.centre = ko.observable(data.centre)
}

var Center = function(data){
    this.name = data.name;
    this.id = data.id;
    this.streetname = data.streetname;
    this.streetno = data.streetno;
    this.postalcode = data.postalcode;
    this.lat = data.lat;
    this.lng = data.lng;
    this.rankings = data.rankings;
    this.filteredRankings = [];
    this.marker = data.marker;
}

var ViewModel = function(){

    var self = this;


    this.editing = ko.observable();
    this.adding = ko.observable();
    this.viewing = ko.observable();
    this.topRanked = ko.observableArray();
    this.rankingList = ko.observableArray();
    this.favList = ko.observableArray([]);
    this.testCenters = ko.observableArray([]);
    this.centers = ko.observableArray([]);
    this.categories = ko.observableArray([]);
    this.markers = ko.observableArray([]);
    this.dishes = ko.observableArray([]);
    this.filterRanking = ko.observable(10);
    this.iconHeight = 35;
    this.iconWidth = this.iconHeight/1.42857143;
    this.iconStyles = {
        gold: {url: './img/markers-full.png', origin: new google.maps.Point(0, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        silver: {url: './img/markers-full.png', origin: new google.maps.Point(this.iconWidth, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        bronze: {url: './img/markers-full.png', origin: new google.maps.Point(this.iconWidth * 2, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        red: {url: './img/markers-full.png', origin: new google.maps.Point(this.iconWidth * 3, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        '1': {url: './img/markers-full.png', origin: new google.maps.Point(0, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        '2': {url: './img/markers-full.png', origin: new google.maps.Point(this.iconWidth, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        '3': {url: './img/markers-full.png', origin: new google.maps.Point(this.iconWidth * 2, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
    };

    this.setMarkerColors = function(){
        var searchTerm = new RegExp(self.generalSearch(), 'i');
        self.visibleMarkers().forEach(function(d){
            var rank = null;

            // if(self.dishExists()){
            //     // console.log('asdasd');
            //     var index = $.inArray(searchString, d.rankings.map(function(e){
            //         return e.dish_name.toLowerCase();
            //     }));
            //     rank = d.rankings[index];
            // } else {
            d.rankings.find(function(e, i){
                if(e.dish_name.match(searchTerm)){
                    rank = e.rank;
                    return true;
                }
            });
            // }

            // console.log(index);

            self.setIcon(d.marker, rank);

            // get the marker style for each item based on its rank
            // var markerRank = d.rankings[index].rank <= 3 ? d.rankings[index].rank : 'red';

            // set the icon
            // d.marker.setIcon(self.iconStyles[markerRank]);
        });
    }

    this.setIcon = function(marker, rank){
        var markerRank = rank <= 3 ? rank : 'red';
        // console.log(markerRank);
        marker.setIcon(self.iconStyles[markerRank]);
        // console.log(marker);
    }

    this.setRanking = function(marker, rankings){

    }

    this.generalSearch = ko.observable();
    this.dishExists = ko.computed(function(){
        var searchTerm = self.generalSearch() ? self.generalSearch().toLowerCase() : '';
        return self.dishes()[$.inArray(searchTerm, self.dishes().map(function(d){return d.toLowerCase()}))];
    });

    this.visibleMarkers = ko.computed(function(){
        console.log('updating visible markers');
        // general search bar
        var searchTerm = new RegExp(self.generalSearch(), 'i');
        var markerIndex = 0;
        // filter centers array
        return self.centers().filter(
            // for each center
            function(d){
                // filter its rankings
                d.filteredRankings = d.rankings.filter(
                    function(e){
                        var dishMatch = e.dish_name.match(searchTerm) ? true : false;
                        var rankMatch = parseInt(e.rank) <= parseInt(self.filterRanking());
                        return dishMatch && rankMatch
                    }
                );
                var filterRanking = d.filteredRankings.find(
                    // for each ranking
                    function(e, i){
                        if(e['dish_name'].match(searchTerm)){
                            d.marker.setZIndex(-e.rank);
                            self.setIcon(d.marker, e.rank);
                            return true;
                        }
                });
                d.marker.setVisible(typeof(filterRanking)!=='undefined');

                // console.log(d.marker);
                google.maps.event.clearListeners(d.marker, 'click');

                d.marker.addListener('click', (function(thisMarker, thisInfo){
                    var rankingHTML = '';
                    if(thisInfo.filteredRankings.length > 0){
                        rankingHTML += '<hr/>';
                        for(var i = 0; i<thisInfo.filteredRankings.length && i<3; i++){
                            rankingHTML += '<i class="fa fa-certificate c-ranking--' + thisInfo.filteredRankings[i].rank + '"></i> <strong>#' + thisInfo.filteredRankings[i].rank + '</strong> for ' + thisInfo.filteredRankings[i].dish_name + '</br>';
                        };
                        if(thisInfo.filteredRankings.length > 3){
                            rankingHTML += 'And '+ (thisInfo.filteredRankings.length - 3) +' more&hellip;';
                        };
                    }
                    return function(){
                        self.changeViewing(thisInfo.id);
                        thisMarker.setAnimation(google.maps.Animation.DROP);
                        self.infoWindow().setContent('<div id="info-window" data-bind="click: function(){moreInfo(' + thisInfo.id + ')}" class="c-infowindow"><h4>' + thisInfo.name + '</h4>'+
                        rankingHTML +
                        '</div>');
                        self.infoWindow().open(map, thisMarker);
                        ko.applyBindings(self, document.getElementById('info-window'));
                    }
                })(d.marker, d));


                return (typeof(filterRanking)!=='undefined');
        });
    });

    self.infoWindow = ko.observable(new google.maps.InfoWindow({}));

    var userFaves = [];

    this.clearMap = function(){
        self.centers().forEach(function(d){
            d.marker.setVisible(false);
            // d.marker.off('click');
        });
    }

    this.updateMap = function(){
        self.clearMap();

        self.visibleMarkers().forEach(function(d){
            if(d.marker.getVisible()==false){
                d.marker.setVisible(true);
            }
        });

        self.setMarkerColors();

        $('#centres-loading-icon').hide();
    }

    this.makeCentresFromData = function(data){
        self.clearMap();

        console.log('running makeCentresFromData function');

        // make a temporary array to store the centres in so we can update the whole array in one shot
        var tempArray = [];

        // create a new infoWindow


        // loop through each item in the results
        for(var key in data){
            // store the item in a variable
            var item = data[key];

            // create a new marker for it
            var marker = new google.maps.Marker({
                position: {lng:parseFloat(data[key]['lng']), lat:parseFloat(data[key]['lat'])},
                map: null,
                visible: true,
                icon: self.iconStyles.red,
            });

            // marker.addListener('click', (function(thisMarker, thisInfo){
            //     console.log(thisInfo);
            //     var rankingHTML = '';
            //     if(thisInfo.rankings.length > 0){
            //         rankingHTML += '<hr/>';
            //         for(var i = 0; i<thisInfo.rankings.length && i<3; i++){
            //             rankingHTML += '<i class="fa fa-certificate c-ranking--' + thisInfo.rankings[i].rank + '"></i> <strong>#' + thisInfo.rankings[i].rank + '</strong> for ' + thisInfo.rankings[i].dish_name + '</br>';
            //         };
            //         if(thisInfo.rankings.length > 3){
            //             rankingHTML += 'And '+ (thisInfo.rankings.length - 3) +' more&hellip;';
            //         };
            //     }
            //     return function(){
            //         self.changeViewing(thisInfo.id);
            //         thisMarker.setAnimation(google.maps.Animation.DROP);
            //         self.infoWindow().setContent('<div id="info-window" data-bind="click: function(){moreInfo(' + thisInfo.id + ')}" class="c-infowindow"><h4>' + thisInfo.name + '</h4>'+
            //         rankingHTML +
            //         '</div>');
            //         self.infoWindow().open(map, thisMarker);
            //         ko.applyBindings(self, document.getElementById('info-window'));
            //     }
            // })(marker, data[key]));

            marker.addListener('visible_changed', function(thisMarker){
                return function(){
                    if(thisMarker.getPosition()==self.infoWindow().getPosition() && !thisMarker.getVisible()){
                        self.infoWindow().close();
                    }
                }
            }(marker));

            self.infoWindow().addListener('closeclick', function(){
                self.clearViewing();
            });

            item['marker'] = marker;
            tempArray.push(new Center(item));
            self.markers.push(marker);
        }
        self.centers(tempArray);

        self.centers().forEach(function(d){
            if(d.marker.getMap()==null){
                d.marker.setMap(map);
            }
        });
    }

    this.init = function(){
        console.log('running init function');
        $.ajax({
            // you need to fix this. if you limit the ranking,
            // centres with no rank above the limit will not be fetched.
            // this causes problems when the user has that in their favourites
            // (and cause we never fetch that center EVER);
            'url': 'http://andreacrawford.design/hawkerdb/centres',
            'success': function(data){
                self.makeCentresFromData(data);

                // for(var key in data){
                //     var item = data[key];
                //
                    // var marker = new google.maps.Marker({
                    //     position: {lng:parseFloat(data[key]['lng']), lat:parseFloat(data[key]['lat'])},
                    //     map: map,
                    //     icon: self.iconStyles.red,
                    // });
                //
                //     marker.addListener('click', (function(thisMarker, thisInfo){
                //         var rankingHTML = '';
                //         if(thisInfo.rankings.length > 0){
                //             rankingHTML += '<hr/>';
                //             for(var i = 0; i<thisInfo.rankings.length && i<3; i++){
                //                 rankingHTML += '<i class="fa fa-certificate c-ranking--' + thisInfo.rankings[i].rank + '"></i> <strong>#' + thisInfo.rankings[i].rank + '</strong> for ' + thisInfo.rankings[i].dish_name + '</br>';
                //             };
                //             if(thisInfo.rankings.length > 3){
                //                 rankingHTML += 'And '+ (thisInfo.rankings.length - 3) +' more&hellip;';
                //             };
                //         }
                //         return function(){
                //             self.changeViewing(thisInfo.id);
                //             thisMarker.setAnimation(google.maps.Animation.DROP);
                //             infoWindow.setContent('<div id="info-window" data-bind="click: function(){moreInfo(' + thisInfo.id + ')}" class="c-infowindow"><h4>' + thisInfo.name + '</h4>'+
                //             rankingHTML +
                //             '</div>');
                //             infoWindow.open(map, thisMarker);
                //             ko.applyBindings(self, document.getElementById('info-window'));
                //         }
                //     })(marker, data[key]));
                //
                //     infoWindow.addListener('closeclick', function(){
                //         self.clearViewing();
                //     });
                //
                    // item['marker'] = marker;
                //
                    // tempArray.push(new Center(item));
                // }
                //
                // self.centers(tempArray);
                // what is this doing again?
                var tempDishes = [].concat.apply([],self.centers().map(function(d){return d.rankings.map(function(e){return e.dish_name;})}))
                tempDishes = $.grep(tempDishes, function(d, i){
                    return $.inArray(d, tempDishes) === i;
                }).sort();
                self.dishes(tempDishes);
                // $('#centres-loading-icon').hide();

                var tempFavs = [];

                $.ajax({
                    'url': 'http://andreacrawford.design/hawkerdb/user/1',
                    'success': function(data){
                        for(var i = 0; i<data.favourites.length; i++){
                            var item = data.favourites[i];
                            tempFavs.push(new Favourite({'centre': $.grep(self.centers(), function(e){return e.id == item.centre_id})[0],
                                                      'dish_id': item.dish_id,
                                                      'dish_name': item.dish_name}));
                        }

                        self.favList(tempFavs);
                    }
                })

                $('#centres-loading-icon').hide();
            }
        })
    };
    // track which view model should be shown on screen
    this.route = ko.observable();
    this.favouriteSearch = ko.observable();
    this.categorySearch = ko.observable();
    // this.updateFavourites = function(){
    //     return db.collection('users').doc('acrawford').collection('favourites').get().then(function(d){
    //         self.favList([]);
    //         d.docs.forEach(function(e){
    //             var data = {
    //                 centerId: e.data().centreId,
    //                 dishId: e.data().dishId,
    //                 center: e.data().centreName,
    //                 category: e.data().dishName,
    //             };
    //             // console.log(data);
    //             self.favList.push(new Favourite(data));
    //             // console.log('updating favourites');
    //         })
    //     });
    // };

    // favourites.forEach(function(favourite){
    //     self.favList.push(new Favourite({category: favourite.dish.name, center: favourite.location.center.name, stall: favourite.location.stall.name}));
    // });

    // centers.forEach(function(center){
    //     self.centers.push(new Center(center));
    // });
    // self.centers(centers.sort(function(a,b){if(a.name < b.name){return -1}else if(a.name > b.name){return 1} else {return 0}}));


    // this.init();


    this.exitFavourites = function(){
        this.route(null);
    };

    this.editFavourites = function(){
        this.route('favourites');
    };

    this.stopPropagation = function(data, event){
        event.stopPropagation();
    };

    this.cancelAdd = function(){
        self.adding(null);
    };

    this.addItem = function(item){
        self.adding(null);
        var selectedName = centers2[parseInt(item.centerId())].name;
        item.center(selectedName);
        self.favList.push(item);
        $.ajax({
            'url': 'http://andreacrawford.design/hawkerdb/votes/',
            'data' : self.editing(),
            'success': function(data){
                console.log(self.editing());
            }
        })
        // db.collection('users').doc('acrawford').collection('favourites').doc(item.dishId())
        //     .set({centreId: item.centerId(), centreName: item.center(), dishName: item.category(), dishId: item.dishId()})
        //     .then(function(){self.updateFavourites();});

    };
//
//     for(var i=0; i<30; i++){
// 	var centreId = Math.round(Math.random()*116);
// db.collection('users').doc('ccrawford').collection('favourites').doc(''+i)
//             .set({centreId: centreId, centers2[centreId]['name'], dishName: item.category(), dishId: i})
// }

    this.deleteItem = function(item){
        self.adding(null);
        self.favList.remove(item);
        // db.collection('users').doc('acrawford').collection('favourites').doc(''+item.dishId())
        //     .delete().then(function(){self.updateFavourites();});
    };

    this.addNew = function(){
        self.adding(new Favourite({category: null, center: null, centerId: null, dishId: null}));
    };

    this.addCategory = function(category){
        self.adding(new Favourite({category: null, center: null, centerId: null, dishId: null}));
        self.adding().category(category.name);
        self.adding().dishId(category.id);
    };

    this.moreInfo = function(id){
        var item = $.grep(self.centers(), function(e){return e.id == id})[0]
        self.viewing(item);
    };

    this.changeViewing = function(id){
        var item = $.grep(self.centers(), function(e){return e.id == id})[0]
        if(self.viewing()){
            self.viewing(item);
        }
    };

    this.clearViewing = function(){
        self.viewing(null);
    };

    this.categoryTemplate = function(category){
        return self.adding() && category.name == self.adding().category() ? 'adding-item' : 'category-item';
    };

    this.toggleEditing = function(favourite){
        if (!self.editing()){
            if (self.editing() == favourite){
                    self.editing(null);
            } else {
                self.editing(favourite);
            }
        } else {
            $.ajax({
                'url':'http://andreacrawford.design/hawkerdb/votes',
                'method':'post',
                'data':{
                    'dish_id': favourite.dish_id,
                    'user_id': 1,
                    'centre_id': favourite.centre().id,
                },
                'success':function(){console.log('success')}
            });
            // console.log(favourite);
            self.editing(!self.editing);
        }
    };

    this.searchResults = ko.computed(function(){
        console.log('running searchResults function');
        var searchTerm = new RegExp(self.favouriteSearch(), 'ig');
        return self.favList().filter(function(d){
            return d.dish_name.match(searchTerm);
        }).sort(function(a, b){
            if(a.dish_name < b.dish_name){
                return -1;
            }
            if(a.dish_name > b.dish_name){
                return 1;
            }
            return 0;
        });
    });

    // this probably shouldn't be computed - what should be computed is visibleMarkers
    // this.getVisibleMarkers = ko.computed(function(){
    //     console.log('running getVisibleMarkers function');
    //     // general search bar
    //     var searchTerm = new RegExp(self.generalSearch(), 'ig');
    //
    //     //find which markers should be visible
    //     var visibleMarkers = self.centers().filter(
    //         function(d){
    //             return d.rankings.filter(
    //                 function(e){
    //                     return e['dish_name'].match(searchTerm);
    //                 }).length > 0;
    //     });
    //
    //
    //     // if self.generalSearch is defined, searchString is the lowercase version
    //     // otherwise it's an empty string
    //     var searchString = self.generalSearch() ? self.generalSearch().toLowerCase() : '';
    //     var dishIndex = $.inArray(searchString, self.dishes().map(function(d){
    //         return d.toLowerCase();
    //     }));
    //
    //     if(dishIndex == -1){
    //         self.dishExists(false);
    //     } else {
    //         self.dishExists(self.dishes()[dishIndex]);
    //     }
    //
    //     if(!self.dishExists()){
    //         // if the searchString is not a dish name, highlight the first ranking in each item's list
    //         // and set topRanked to empty
    //         self.topRanked([]);
    //     } else {
    //         // else populate top ranked with the visible markers
    //         // this is the same data as visibleMarkers, just re-ordered
    //         self.topRanked(visibleMarkers.map(function(d){return {'name': d.name, 'id': d.id, 'rank': d.rankings.filter(function(e){return e.dish_name.toLowerCase()==searchString})[0].rank}}).sort(function(a,b){return a.rank - b.rank}))
    //     }
    //
    //     visibleMarkers.forEach(function(d){
    //         var index = 0;
    //
    //         if(self.dishExists()){
    //             index = $.inArray(searchString, d.rankings.map(function(e){
    //                 return e.dish_name.toLowerCase();
    //             }));
    //         } else {
    //             d.rankings.find(function(e, i){
    //                 if(e.dish_name.match(searchTerm)){
    //                     index = i;
    //                     return true;
    //                 }
    //             })
    //         }
    //
    //         // get the marker style for each item based on its rank
    //         var markerRank = d.rankings[index].rank <= 3 ? d.rankings[index].rank : 'red';
    //
    //         // set the icon
    //         d.marker.setIcon(self.iconStyles[markerRank]);
    //     });
    //
    //     // self.visibleMarkers(visibleMarkers);
    //     self.updateMap();
    // });



        // set visibleMarkers to the temporary variable visibleMarkers
        // self.visibleMarkers(visibleMarkers);

        // find which markers should be hidden
        // var hiddenMarkers = self.centers().filter(
        //     function(d){
        //         return d.rankings.filter(
        //             function(e){
        //                 return e['dish_name'].match(searchTerm);
        //             }).length == 0;
        // });

        // hide all the hidden markers
        // hiddenMarkers.forEach(function(d){
        //     if(d.marker){
        //         d.marker.setMap(null);
        //     }
        //     console.log('hiding marker:', d);
        // });

        // console.log('hiddenMarkers');

        // if self.generalSearch is defined, searchString is the lowercase version
        // otherwise it's an empty string
        // var searchString = self.generalSearch() ? self.generalSearch().toLowerCase() : '';

        // if($.inArray(searchString, self.dishes().map(function(d){
        //     return d.toLowerCase();
        // })) == -1){
        //     self.dishExists(false);
        // } else {
        //     self.dishExists(true);
        // }
        //
        // if(!self.dishExists()){
        //     // if the searchString is not a dish name, highlight the first ranking in each item's list
        //     // and set topRanked to empty
        //     self.topRanked([]);
        // } else {
        //     // else populate top ranked with the visible markers
        //     // this is the same data as visibleMarkers, just re-ordered
        //     self.topRanked(self.visibleMarkers().map(function(d){return {'name': d.name, 'id': d.id, 'rank': d.rankings.filter(function(e){return e.dish_name.toLowerCase()==searchString})[0].rank}}).sort(function(a,b){return a.rank - b.rank}))
        // }
        //
        // visibleMarkers.forEach(function(d){
        //     // if the marker should be visible and has no map set, set the map
        //     if (d.marker.getMap()==null){
        //         d.marker.setMap(map);
        //     }
        //
        //     var index = 0;
        //
        //     if(self.dishExists()){
        //         index = $.inArray(searchString, d.rankings.map(function(e){
        //             return e.dish_name.toLowerCase();
        //         }));
        //     }
        //     // get the marker style for each item based on its rank
        //     var markerRank = d.rankings[index].rank <= 3 ? d.rankings[index].rank : 'red';
        //
        //     // set the icon
        //     d.marker.setIcon(self.iconStyles[markerRank]);
        // });
        //
        // test = self.visibleMarkers();
        //
        // // make a temporary ranking array to push info to
        // var tempRanking = [];
        //
        // // topRanked, rankingList and visibleMarkers all show the same info
        // // just rearranged...
        //
        // self.topRanked().forEach(function(f){
        // 	if(tempRanking[f.rank]){
        // 		tempRanking[f.rank].push(f);
        //     } else {
        // 		tempRanking[f.rank] = [f];
        //     }
        // });
        //
        // self.rankingList(tempRanking);
        //
        // return self.visibleMarkers();
    // });

    // this.changeRank = ko.computed(function(){
    //     console.log('running changeRank function');
    //     if(self.filterRanking() > 0){
    //         $('#centres-loading-icon').show();
    //         // $('#rankingFilter').attr('disabled', true);
    //         self.centers().forEach(
    //             function(d){
    //                 d.filteredRankings = d.rankings.filter(function(e){return e.rank <= self.filterRanking();
    //                 });
    //             });

            // $.ajax({
            //     // you need to fix this. if you limit the ranking,
            //     // centres with no rank above the limit will not be fetched.
            //     // this causes problems when the user has that in their favourites
            //     // (and cause we never fetch that center EVER);
            //     'url': 'http://andreacrawford.design/hawkerdb/centres?ranklimit=' + self.filterRanking(),
            //     'success': function(data){
            //         // console.log('these are the centers we have:', self.centers());
            //         // self.init();
            //
            //         // self.centers(tempArray);
            //         self.makeCentresFromData(data);
            //         // self.visibleMarkers(self.centers().filter(function(d){
            //         //     return d.rankings.length;
            //         // }));
            //         self.updateMap();
            //         $('#rankingFilter').attr('disabled', false);
            //         $('#rankingFilter').focus();
            //         // $('#centres-loading-icon').hide();
            //     },
            // });
    //
    //     };
    // });

    // this.updateMarkers = ko.computed(function(){
    //     console.log(self.markers());
    //     for(var i=0; i<self.markers().length; i++){
    //         self.markers()[i].setMap(null);
    //     };
    //
    //     self.markers([]);
    //
    //     var infoWindow = new google.maps.InfoWindow({});
    //
    //     // console.log(map.markers.length);
    //     console.log('aaaaaaaaaaaaaaaand here i am');
    //     console.log(self.centers().length);
    //
    //     for(var i=0; i<self.visibleCenters().length; i++){
    //         var marker = new google.maps.Marker({
    //             position: {lng:parseFloat(self.visibleCenters()[i]['lng']), lat:parseFloat(self.visibleCenters()[i]['lat'])},
    //             map: map,
    //         });
    //
    //         marker.addListener('click', (function(thisMarker, thisInfo){
    //             var rankingHTML = '';
    //             if(thisInfo.rankings.length > 0){
    //                 rankingHTML += '<hr/>';
    //                 for(var i = 0; i<thisInfo.rankings.length && i<3; i++){
    //                     rankingHTML += '<i class="fa fa-certificate c-ranking--' + thisInfo.rankings[i].rank + '"></i> <strong>#' + thisInfo.rankings[i].rank + '</strong> for ' + thisInfo.rankings[i].dish_name + '</br>';
    //                 };
    //                 if(thisInfo.rankings.length > 3){
    //                     rankingHTML += 'And '+ (thisInfo.rankings.length - 3) +' more&hellip;';
    //                 };
    //             }
    //             return function(){
    //                 self.changeViewing(thisInfo.id);
    //                 thisMarker.setAnimation(google.maps.Animation.DROP);
    //                 infoWindow.setContent('<div id="info-window" data-bind="click: function(){moreInfo(' + thisInfo.id + ')}" class="c-infowindow"><h4>' + thisInfo.name + '</h4>'+
    //                 rankingHTML +
    //                 '</div>');
    //                 infoWindow.open(map, thisMarker);
    //                 ko.applyBindings(self, document.getElementById('info-window'));
    //             }
    //         })(marker, self.visibleCenters()[i]))
    //
    //         self.markers.push(marker);
    //
    //         infoWindow.addListener('closeclick', function(){
    //             self.clearViewing();
    //         });
    //
    //
    //         }
    //     $('#centres-loading-icon').hide();
    // });


    //
    // this.generalResults = ko.computed(function(){
    //     var searchTerm = new RegExp(self.generalSearch(), 'ig');
    //     // var searchTerm = new RegExp('chicken porridge', 'ig');
    //     console.log('running generalResults');
    //     // self.updateMarkers(self.centers().filter(
    //     //     function(d){
    //     //         return d.rankings.filter(
    //     //             function(e){
    //     //                 return e['dish_name'].match(searchTerm);
    //     //             }).length > 0;
    //     //         }));
    //     // test = self.centers();
    //     self.visibleCenters(self.centers().filter(
    //         function(d){
    //             return d.rankings.filter(
    //                 function(e){
    //                     return e['dish_name'].match(searchTerm);
    //                 }).length > 0;
    //             }));
    //     // self.updateMarkers();
    //     // return self.centers().filter(function(d){
    //     //     // console.log(d);
    //     //     return d.rankings[0]['dish_name'].match(searchTerm);
    //     // }).sort(function(a, b){
    //     //     if(a.dish_name < b.dish_name){
    //     //         return -1;
    //     //     }
    //     //     if(a.dish_name > b.dish_name){
    //     //         return 1;
    //     //     }
    //     //     return 0;
    //     // });
    // });

    this.clearSelected = function(){
        if(self.adding()){
            self.adding().category(null);
        }
    };

    this.categorySearchResults = ko.computed(function(){
        if(self.adding()){
            // self.adding().category(null);
        };
        var existing = self.favList().map(function(d){return d.dish_name});
        var searchTerm = new RegExp(self.categorySearch(), 'ig');
        return self.categories().filter(function(d){
            return d.name.match(searchTerm) && $.inArray(d.name, existing)==-1;
        }).sort(function(a, b){
            if(a.name < b.name){
                return -1;
            }
            if(a.name > b.name){
                return 1;
            }
            return 0;
        });
    });
    this.messages = ko.computed(function(){
        var plural = self.visibleMarkers().length == 1 ? '' : 's';
        var wording = self.filterRanking() == 1 ? '' : ' or higher';
        var category;
        if(self.generalSearch()){
            if(self.dishExists()){
                category = ' in the category <span class="c-message-list__emphasis">' + self.dishExists() + '</span>';
            } else {
                category = ' in categories containing <span class="c-message-list__emphasis">\'' + self.generalSearch() + '\'</span>';
            }
        } else {
            category = ' in <span class="c-message-list__emphasis">any</span> category';
        }
        // var category = self.generalSearch() ? ' in the category <span class="c-message-list__emphasis">' + self.generalSearch() + '</span>' : ' in <span class="c-message-list__emphasis">any</span> category';
        return [{message: "Showing <span class='c-message-list__emphasis'>" +  self.visibleMarkers().length + "</span> result" + plural + " with a ranking of <span class='c-message-list__emphasis'>" + self.filterRanking() + wording + "</span>" + category}];
    });

}

$(document).ready(function(){
    // ko.options.deferUpdates = true;

    vm = new ViewModel();
    ko.applyBindings(vm);
    vm.init();
})
