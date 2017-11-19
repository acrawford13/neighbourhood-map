var favourites = [
    {
        dish: {
            name: "Chicken Rice",
            id: 1
        },
        location: {
            center: {
                name: "Sembawang Hills Food Centre",
                id: 1
            },
            stall: {
                name: "#08-09",
                id: 1,
            }
        }
    },
    {
        dish: {
            name: "Chicken Biryani",
            id: 2
        },
        location: {
            center: {
                name: "Geylang Serai Market",
                id: 2
            },
            stall: {
                name: "#00-09",
                id: 3,
            }
        }
    },
    {
        dish: {
            name: "Pig Organ Soup",
            id: 3
        },
        location: {
            center: {
                name: "Sembawang Hills Food Centre",
                id: 1
            },
            stall: {
                name: "#02-01",
                id: 3,
            }
        }
    }
];




var Favourite = function(data){
    this.dishId = ko.observable(data.dishId),
    this.category = ko.observable(data.category);
    this.centerId = ko.observable(data.centerId);
    this.center = ko.observable(data.center);
}

var Center = function(data){
    this.name = ko.observable(data.name);
    this.id = ko.observable(data.id);
}

// var centers = [];
// var dishes = [];
// var dishes2 = {};
// var centers2 = {};
// var favs = {};
// var categories = ['Chicken Porridge', 'Fish Porridge', 'Chicken Rice', 'Carrot Cake', 'Wanton Mee', 'Curry Fish Head', 'Bak Chor Mee', 'Hokkien Prawn Mee', 'Satay Bee Hoon', 'Satay', 'Tau Huay', 'Ice Kacang', 'Chwee Kway', 'Nasi Lemak', 'Mee Siam', 'Mee Rebus', 'Lontong', 'Roti Prata', 'Rojak', 'Duck Rice', 'Char Kway Teow', 'Curry Puff', 'Popiah', 'Char Siew Rice', 'Bak Kut Teh', 'Yong Tau Foo', 'Chicken Biryani', 'Mutton Biryani', 'Laksa', 'Pig Organ Soup'];

var ViewModel = function(){

    var self = this;

    this.favList = ko.observableArray([]);
    this.centers = ko.observableArray([]);
    this.categories = ko.observableArray([]);

    var userFaves = [];

    // db.collection('centres').get().then(function(d){
    //     centres.forEach(function(e){
    //         var centre = e.data();
    //         var ranking = [];
    //         for(key in centre.ranking){
    //             if(centre.ranking[key].position != null){
    //                 ranking.push(centre.ranking[key]);
    //             }
    //         }
    //         ranking.sort(function(a, b){
    //             var pos = a.position - b.position;
    //             console.log(pos);
    //             if (pos != 0){
    //                 return pos;
    //             } else {
    //                 if (a.dishName > b.dishName){
    //                     return 1;
    //                 } else if (a.dishName < b.dishName){
    //                     return -1;
    //                 } else {
    //                     return 0;
    //                 }
    //             }
    //         });
    //         centre.ranking = ranking;
    //         centers2[e.id] = centre;
    //         // centers2[e.id]['rankings'] = [];
    //         // e.ref.collection('rankings').get().then(function(f){
    //             // f.docs.forEach(function(g){
    //                 // console.log(g.data());
    //                 // centers2[e.id]['rankings'].push(g.data());
    //             // })
    //             centers.push(centre);
    //             self.centers.push(new Center(centre));
    //         // });
    //         // e.ref.collection('rankings').get().then(function(f){
    //         //     centers2[e.id].rankings = ['dsa'];
    //         //     f.docs.forEach(function(g){
    //         //         centers2[e.id].rankings.push(g.data());
    //         //     })
    //         // })
    //     });
    // }).then(
    // // db.collection('centres').get().then(function(d){
    // //     d.docs.forEach(function(e){
    // //         centers.push(e.data());
    // //         centers2[e.id] = e.data();
    // //         self.centers.push(new Center(e.data()));
    // //     })
    // // }).then(
    // db.collection('dishes').get().then(function(d){
    //     d.docs.forEach(function(e){
    //         dishes.push(e.data());
    //         dishes2[e.id] = e.data();
    //         self.categories.push({name: e.data().name, id: e.id});
    //     })
    // })).then(initMap).then(
    // db.collection('users').doc('acrawford').collection('favourites').get().then(function(d){
    //     d.docs.forEach(function(e){
    //         var data = {
    //             centerId: e.data().centreId,
    //             dishId: e.data().dishId,
    //             center: e.data().centreName,
    //             category: e.data().dishName,
    //         };
    //         // console.log(data);
    //         self.favList.push(new Favourite(data));
    //         // console.log(self.favList());
    //     })
    // }))

    $.ajax({
        'url': 'http://andreacrawford.design/hawkerdb/user/1',
        'success': function(data){
            for(var i = 0; i<data.favourites.length; i++){
                var item = data.favourites[i];
                self.favList.push(new Favourite({centerId: item.centre_id,
                                                 dishId: item.dish_id,
                                                 center: item.centre_name,
                                                 category: item.dish_name,
                                                }));
            }
            console.log(self.favList());
        }
    })

    $.ajax({
        'url': 'http://andreacrawford.design/hawkerdb/centres/',
        'success': function(data){
            for(var key in data){
                var item = data[key];
                self.centers.push(new Center({name: item.name, id: item.id}));
            }

            console.log(self.centers());
        }
    })

    // for(i in centres){
    //     var centre = centres[i];
    //     self.centers.push(new Center(centre));
    // }

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
            self.editing(!self.editing);
        }
    };

    this.searchResults = ko.computed(function(){
        var searchTerm = new RegExp(self.favouriteSearch(), 'ig');
        return self.favList().filter(function(d){
            // console.log(d);
            return d.category().match(searchTerm);
        }).sort(function(a, b){
            if(a.category() < b.category()){
                return -1;
            }
            if(a.category() > b.category()){
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
        var existing = self.favList().map(function(d){return d.category()});
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

ko.applyBindings(new ViewModel());
