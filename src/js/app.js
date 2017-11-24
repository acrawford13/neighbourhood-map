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
}

var ViewModel = function(){

    var self = this;

    this.favList = ko.observableArray([]);
    this.testCenters = ko.observableArray([]);
    this.centers = ko.observableArray([]);
    this.categories = ko.observableArray([]);

    var userFaves = [];

    this.init = function(){
        $.ajax({
            'url': 'http://andreacrawford.design/hawkerdb/centres/',
            'success': function(data){
                self.centers.removeAll();
                for(var key in data){
                    var item = data[key];
                    self.centers.push(new Center(item));
                    console.log(self.centers().length);
                }

                $.ajax({
                    'url': 'http://andreacrawford.design/hawkerdb/user/1',
                    'success': function(data){
                        for(var i = 0; i<data.favourites.length; i++){
                            var item = data.favourites[i];
                            self.favList.push(new Favourite({'centre': $.grep(self.centers(), function(e){return e.id == item.centre_id})[0],
                                                      'dish_id': item.dish_id,
                                                      'dish_name': item.dish_name}));
                        }
                    }
                })
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


    this.editing = ko.observable();
    this.adding = ko.observable();
    this.viewing = ko.observable();

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
        // console.log(item);
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
        // console.log(self.centers().length);
        var item = $.grep(self.centers(), function(e){return e.id == id})[0]
        console.log(item);
        console.log(id);
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
        var searchTerm = new RegExp(self.favouriteSearch(), 'ig');
        return self.favList().filter(function(d){
            // console.log(d);
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

}

$(document).ready(function(){
    vm = new ViewModel();
    ko.applyBindings(vm);
    vm.init();
})
