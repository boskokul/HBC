// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TouristAgency {
    struct Apartment {
        uint256 id;
        address owner;
        string name;
        string location;
        string description;
        uint256 pricePerNight;
        string[] imageUrls;
        bool isDeleted;
    }
    
    struct Booking {
        uint256 bookingId;
        uint256 apartmentId;
        address guest;
        uint256 checkInDate;
        uint256 checkOutDate;
        uint256 totalPrice;
        BookingStatus status;
        uint256 timestamp;
    }
    
    enum BookingStatus {
        Booked,
        CheckedIn,
        CheckedOut,
        Cancelled,
        Refunded
    }
    
    mapping(uint256 => Apartment) public apartments;
    mapping(uint256 => Booking) public bookings;
    mapping(address => uint256[]) public ownerApartments;
    mapping(address => uint256[]) public guestBookings;
    
    uint256 public apartmentCounter;
    uint256 public bookingCounter;
    uint256 public constant SECONDS_PER_DAY = 86400;
    
    event ApartmentListed(uint256 indexed apartmentId, address indexed owner, string name);
    event BookingMade(uint256 indexed bookingId, uint256 indexed apartmentId, address indexed guest);
    event CheckIn(uint256 indexed bookingId, uint256 timestamp);
    event CheckOut(uint256 indexed bookingId, uint256 timestamp);
    event BookingCancelled(uint256 indexed bookingId, uint256 refundAmount);
    
    function listApartment(
        string memory _name,
        string memory _location,
        string memory _description,
        uint256 _pricePerNight,
        string[] memory _imageUrls
    ) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_pricePerNight > 0, "Price must be greater than 0");
        
        apartmentCounter++;
        
        apartments[apartmentCounter] = Apartment({
            id: apartmentCounter,
            owner: msg.sender,
            name: _name,
            location: _location,
            description: _description,
            pricePerNight: _pricePerNight,
            imageUrls: _imageUrls,
            isDeleted: false
        });
        
        ownerApartments[msg.sender].push(apartmentCounter);
        
        emit ApartmentListed(apartmentCounter, msg.sender, _name);
    }
    
    function bookApartment(
        uint256 _apartmentId,
        uint256 _checkInDate,
        uint256 _checkOutDate
    ) external payable {
        require(_apartmentId > 0 && _apartmentId <= apartmentCounter, "Invalid apartment ID");
        // require(_checkInDate >= block.timestamp, "Check-in date must be in the future");
        require(_checkOutDate > _checkInDate, "Check-out must be after check-in");
        require(msg.sender != apartments[_apartmentId].owner, "Owner cannot book own apartment");
        require(!apartments[_apartmentId].isDeleted , "Apartment deleted");
        
        uint256 nights = (_checkOutDate - _checkInDate) / SECONDS_PER_DAY;
        uint256 totalPrice = nights * apartments[_apartmentId].pricePerNight;
        
        require(msg.value >= totalPrice, "Insufficient payment");

        require(!areDatesOverlapping(_apartmentId, _checkInDate, _checkOutDate), "Dates not available");
        
        bookingCounter++;
        
        bookings[bookingCounter] = Booking({
            bookingId: bookingCounter,
            apartmentId: _apartmentId,
            guest: msg.sender,
            checkInDate: _checkInDate,
            checkOutDate: _checkOutDate,
            totalPrice: totalPrice,
            status: BookingStatus.Booked,
            timestamp: block.timestamp
        });
        
        guestBookings[msg.sender].push(bookingCounter);
        
        // Kusur
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit BookingMade(bookingCounter, _apartmentId, msg.sender);
    }
    
    function checkIn(uint256 _bookingId) external {
        require(bookings[_bookingId].guest == msg.sender, "Not booking guest");
        Booking storage booking = bookings[_bookingId];
        require(booking.status == BookingStatus.Booked, "Booking not booked");
        // require(block.timestamp >= booking.checkInDate, "Too early to check in");
        // require(block.timestamp <= booking.checkOutDate, "Booking expired");
        
        booking.status = BookingStatus.CheckedIn;
        
        uint256 ownerPayment = booking.totalPrice / 2;
        payable(apartments[booking.apartmentId].owner).transfer(ownerPayment);
        
        emit CheckIn(_bookingId, block.timestamp);
    }
    
    function checkOut(uint256 _bookingId) external {
        Booking storage booking = bookings[_bookingId];
        require(
            msg.sender == booking.guest || msg.sender == apartments[booking.apartmentId].owner,
            "Only guest or owner can check out"
        );
        require(booking.status == BookingStatus.CheckedIn, "Not checked in");
        
        booking.status = BookingStatus.CheckedOut;
        
        uint256 remainingPayment = booking.totalPrice / 2;
        payable(apartments[booking.apartmentId].owner).transfer(remainingPayment);
        
        emit CheckOut(_bookingId, block.timestamp);
    }
    
    function cancelBooking(uint256 _bookingId) external {
        require(bookings[_bookingId].guest == msg.sender, "Not booking guest");
        Booking storage booking = bookings[_bookingId];
        require(booking.status == BookingStatus.Booked, "Booking not booked");
        require(block.timestamp < booking.checkInDate, "Too late to cancel");
        
        booking.status = BookingStatus.Cancelled;
        
        uint256 refundAmount = (booking.totalPrice * 90) / 100;
        payable(booking.guest).transfer(refundAmount);
        
        uint256 fee = booking.totalPrice - refundAmount;
        payable(apartments[booking.apartmentId].owner).transfer(fee);
        
        booking.status = BookingStatus.Refunded;
        
        emit BookingCancelled(_bookingId, refundAmount);
    }
    
    function getBooking(uint256 _bookingId) external view returns (Booking memory) {
        return bookings[_bookingId];
    }
    
    function getOwnerApartments(address _owner) external view returns (uint256[] memory) {
        return ownerApartments[_owner];
    }
    
    function getGuestBookings(address _guest) external view returns (uint256[] memory) {
        return guestBookings[_guest];
    }
    
    function getAllApartments() external view returns (Apartment[] memory) {
        Apartment[] memory allApartments = new Apartment[](apartmentCounter);
        uint256 activeApartmentCounter = 0;
        for (uint256 i = 1; i <= apartmentCounter; i++) {
            if(!apartments[i].isDeleted){
                allApartments[activeApartmentCounter] = apartments[i];
                activeApartmentCounter++;
            }
        }
        return allApartments;
    }
    
    function updateApartmentPrice(uint256 _apartmentId, uint256 _newPrice) external {
        require(apartments[_apartmentId].owner == msg.sender, "Not apartment owner");
        require(_newPrice > 0, "Price must be greater than 0");
        apartments[_apartmentId].pricePerNight = _newPrice;
    }

    function areDatesOverlapping(uint256 apartmentId, uint256 checkInDate, uint256 checkOutDate) private view returns (bool) {
        for (uint256 i = 1; i <= bookingCounter; i++) {
            if (bookings[i].apartmentId == apartmentId) {
                if (bookings[i].checkInDate < checkOutDate && checkInDate < bookings[i].checkOutDate) {
                    return true;
                }
            }
        }
        return false;
    }

    function deleteApartment(uint256 _apartmentId) external {
        require(apartments[_apartmentId].owner == msg.sender, "Not apartment owner");
        apartments[_apartmentId].isDeleted = true;
    }
}