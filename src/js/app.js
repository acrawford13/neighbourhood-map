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

var ViewModel = function(){
    var self = this;

    this.favList = ko.observableArray([]);

    favourites.forEach(function(favourite){
        self.favList.push(new Favourite(favourite));
    })

    this.setEditing = function(favourite){
        console.log('editing ' + favourite.category());
    }
}

ko.applyBindings(new ViewModel());
