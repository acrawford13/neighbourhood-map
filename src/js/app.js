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
            name: "Chicken Biryani",
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
    this.category = ko.observable(data.category);
    this.center = ko.observable(data.center);
    this.stall = ko.observable(data.stall);
}

var Center = function(data){
    this.name = ko.observable(data.name);
    this.id = ko.observable(data.id);
}

var ViewModel = function(){
    var self = this;
    this.categories = ko.observableArray(['Chicken Porridge', 'Fish Porridge', 'Chicken Rice', 'Carrot Cake', 'Wanton Mee', 'Curry Fish Head', 'Bak Chor Mee', 'Hokkien Prawn Mee', 'Satay Bee Hoon', 'Satay', 'Tau Huay', 'Ice Kacang', 'Chwee Kway', 'Nasi Lemak', 'Mee Siam', 'Mee Rebus', 'Lontong', 'Roti Prata', 'Rojak', 'Duck Rice', 'Char Kway Teow', 'Curry Puff', 'Popiah', 'Char Siew Rice', 'Bak Kut Teh', 'Yong Tau Foo', 'Chicken Biryani', 'Mutton Biryani', 'Laksa', 'Pig Organ Soup']);

    this.stallError = ko.observable(false);
    this.favouriteSearch = ko.observable();
    this.categorySearch = ko.observable();

    this.favList = ko.observableArray([]);
    this.centers = ko.observableArray([]);

    favourites.forEach(function(favourite){
        self.favList.push(new Favourite({category: favourite.dish.name, center: favourite.location.center.name, stall: favourite.location.stall.name}));
    });

    centers.forEach(function(center){
        self.centers.push(new Center(center));
    });

    this.editing = ko.observable();
    this.adding = ko.observable();

    this.stopPropagation = function(data, event){
        event.stopPropagation();
    };

    this.resetStall = function(favourite){
        favourite.stall(null);
    };

    this.cancelAdd = function(){
        self.adding(null);
    };

    this.addItem = function(item){
        console.log(item);
        self.favList.push(item);
        self.adding(null);
        // console.log(self.adding());
    };

    this.addNew = function(){
        self.adding(new Favourite({category: null, center: null, stall: null}));
    };

    this.addCategory = function(category){
        self.adding(new Favourite({category: null, center: null, stall: null}));
        self.adding().category(category);
        console.log(self.adding());
        // self.editing(self.adding());
        // self.adding(null);
    };

    this.categoryTemplate = function(category){
        return self.adding() && category == self.adding().category() ? 'adding-item' : 'category-item';
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
        favourite.center()
    };

    this.searchResults = ko.computed(function(){
        var searchTerm = new RegExp(self.favouriteSearch(), 'ig');
        return self.favList().filter(function(d){
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
        console.log('asd');
        if(self.adding()){
            self.adding().category(null);
        }
    };

    this.categorySearchResults = ko.computed(function(){
        if(self.adding()){
            // self.adding().category(null);
        };

        var searchTerm = new RegExp(self.categorySearch(), 'ig');
        var existing = self.favList().map(function(d){return d.category()});
        return self.categories().filter(function(d){
            return d.match(searchTerm) && $.inArray(d, existing)==-1;
        }).sort();
    });
}

ko.applyBindings(new ViewModel());
