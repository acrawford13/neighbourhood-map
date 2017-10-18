var centers = [
    {
        name: "Sembawang Hill Food Center",
        id: 1
    },
    {
        name: "Geylang Serai Marketplace",
        id: 2
    },
    {
        name: "Sims Vista Food Center",
        id: 3
    },
    {
        name: "Chomp Chomp",
        id: 4
    }
];

var favourites = [
    {
        dish: {
            name: "Chicken Rice",
            id: 1
        },
        location: {
            center: {
                name: "Sembawang Hill Food Center",
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
            name: "Chicken Briyani",
            id: 2
        },
        location: {
            center: {
                name: "Geylang Serai Marketplace",
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
                name: "Sembawang Hill Food Center",
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
    this.category = ko.observable(data.dish.name);
    this.center = ko.observable(data.location.center.name);
    this.stall = ko.observable(data.location.stall.name);
}

var Center = function(data){
    this.name = ko.observable(data.name);
    this.id = ko.observable(data.id);
}

var ViewModel = function(){
    var self = this;

    this.stallError = ko.observable(false);

    this.favList = ko.observableArray([]);
    this.centers = ko.observableArray([]);

    favourites.forEach(function(favourite){
        self.favList.push(new Favourite(favourite));
    });

    centers.forEach(function(center){
        self.centers.push(new Center(center));
    });

    this.editing = ko.observable();

    this.stopPropagation = function(data, event){
        event.stopPropagation();
    };

    this.resetStall = function(favourite){
        favourite.stall(null);
    };

    this.toggleEditing = function(favourite){
        if (!self.editing() || self.editing().stall()){
            if (self.editing() == favourite){
                    self.editing(null);
            } else {
                self.editing(favourite);
            }
        } else {
            self.stallError(true);
        }
    };

    this.changeFav = function(favourite, event){
        console.log(favourite);
        console.log(event);
        favourite.center()
    };
}

ko.applyBindings(new ViewModel());
