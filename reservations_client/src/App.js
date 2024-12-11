import React, { useState, useEffect } from 'react';
import './App.css'
import { useLocation } from 'react-router-dom';

function App() {
  const [restaurant, setRestaurant] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [party, setParty] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [reservations, setReservations] = useState([]);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const location = useLocation();
  const username = location.state?.username || 'Guest'; // Fallback to "Guest" if username is not provided

  // for sorting
  const [category, setCategory] = useState(localStorage.getItem('selectedCategory') || '');

  // for searching
  const [search, setSearch] = useState('');

  // for editing:

  const [editData, setEditData] = useState({});

  const [restaurants, setRestaurants] = useState([]);
  const [displayRestaurant, setDisplayRestaurant] = useState([]);

  const [myRating, setMyRating] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL;
  console.log(apiUrl);

  // call to server to fetch restaurant list
  const fetchRestaurants = async () => {
    try {
//      const response = await fetch('https://chellee-cs348-project.appspot.com/restaurant');
      const response = await fetch(`${apiUrl}/restaurant`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRestaurants(data);
    } catch (err) {
      console.error("Error fetching restaurants", err);
    }
  };

  // call to server to get reservations
  // added filter by username for the reservation (note reservation table updated with user_Id and restaurant_Id)
  const fetchReservations = async () => {

    try {
      const response = await fetch(`${apiUrl}/reservation?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      setReservations(data);
    } catch (err) {
      console.error("Error fetching reservations", err);
    }
  };

  useEffect(() => {
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
      setCategory(savedCategory);
  
      if (savedCategory === 'DateAsc') {
        sortDateAscending();
      } else if (savedCategory === 'DateDesc') {
        sortDateDescending();
      } else if (savedCategory === 'PartyDesc') {
        sortPartyDescending();
      } else if (savedCategory === 'PartyAsc') {
        sortPartyAscending();
      }
    }
    else {
      fetchReservations();
    }
    
    fetchRestaurants();
  }, []);

  // (note reservation table updated with user_Id and restaurant_Id)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/reservation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify ({
	  username: username,
          restaurant: selectedRestaurant,
          party: parseInt(party),
          date: date,
          time: time,
          note: note
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setResponseMessage(`Reservation added: ${data.restaurant}`);

      fetchReservations();
      setSelectedRestaurant('');
      setParty('');
      setDate('');
      setTime('');
      setNote('');
    } catch (err) {
      setResponseMessage(err.message || 'Error adding reservation');
    }
  };

  // call to server to edit reservations
  const handleEdit = async (reservationId, updatedReservation) => {
    console.log(updatedReservation);
    try {
      const response = await fetch(`${apiUrl}/reservation/edit/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedReservation),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setResponseMessage(`Reservation edited: ${data.restaurant}`);
      fetchReservations();
    } catch (err) {
      setResponseMessage('Error editing reservation');
    }
  };

  // call to server to delete reservations
  const handleDelete = async (reservationId) => {
    try {
      const response = await fetch(`${apiUrl}/reservation/${reservationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } 
    } catch (err) {
      setResponseMessage('Error deleting reservation');
    }
    fetchReservations();
  };

  // call to server to filter
  const handleSortChange = (e) => {
    const selectedCategory = e.target.value;
    
    setCategory(selectedCategory); 
    localStorage.setItem('selectedCategory', selectedCategory);
  
    if (selectedCategory === 'DateAsc') {
      sortDateAscending();
    } else if (selectedCategory === 'DateDesc') {
      sortDateDescending();
    } else if (selectedCategory === 'PartyAsc'){
      sortPartyAscending();
    } else if (selectedCategory === 'PartyDesc') {
      sortPartyDescending();
    } else {
      setCategory('');
      localStorage.removeItem('selectedCategory');
      fetchReservations();
    }
  };

  // call to server to sort by date
  const sortDateDescending = async () => {
    try {
      const response = await fetch (`${apiUrl}/reservation/sorted-date?sort=desc&username=${encodeURIComponent(username)}`, 
        { method: 'GET'} ,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } 
      const sortedReservations = await response.json();
      setReservations(sortedReservations);
    } catch (err) {
      setResponseMessage('Error sorting reservation');
    }
    //fetchReservations();
  };

  // call to server to sort by date
  const sortDateAscending = async () => {
    try {
      const response = await fetch (`${apiUrl}/reservation/sorted-date?sort=asc&username=${encodeURIComponent(username)}`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } 
      const sortedReservations = await response.json();
      setReservations(sortedReservations);
    } catch (err) {
      setResponseMessage('Error sorting reservation');
    }
    //fetchReservations();
  };

  // call to server to sort by date
  const sortPartyDescending = async () => {
    try {
      const response = await fetch (`${apiUrl}/reservation/sorted-party?sort=desc&username=${encodeURIComponent(username)}`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } 
      const sortedReservations = await response.json();
      setReservations(sortedReservations);
    } catch (err) {
      setResponseMessage('Error sorting reservation');
    }
    //fetchReservations();
  };

  // call to server to sort by date
  const sortPartyAscending = async () => {
    try {
      const response = await fetch (`${apiUrl}/reservation/sorted-party?sort=asc&username=${encodeURIComponent(username)}`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } 
      const sortedReservations = await response.json();
      setReservations(sortedReservations);
    } catch (err) {
      setResponseMessage('Error sorting reservation');
    }
    //fetchReservations();
  };

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);
    searchReservation(searchTerm); // Trigger search whenever the input changes
  };

  // call to server to search by restaurant name
  const searchReservation = async (searchTerm) => {  
    //console.log(searchTerm)
    try {
      const response = await fetch (`${apiUrl}/reservation/search?q=${encodeURIComponent(searchTerm)}&username=${encodeURIComponent(username)}`, { // encodeURIComponent prevents injections
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      //console.log("Returning" ,data);
      setReservations(data);
    } catch (err) {
      setResponseMessage('Error searching reservation');
    }
  };

  // call to server to search by date
  const handleDateSearch = async () => {
    if (startDate && endDate) {
      console.log("Searching between:", startDate, endDate);
    } else {
      alert("Please select both start and end dates.");
    }
    try {
       const response = await fetch (`${apiUrl}/reservation/searchByDate?username=${encodeURIComponent(username)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, { // encodeURIComponent prevents injections
          method: 'GET',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        } 
        const data = await response.json();
        //console.log("Returning" ,data);
        setReservations(data);
      } catch (err) {
        setResponseMessage('Error searching reservation');
      }   
    };


  // -------------------- Restaurant Rating calls ---------------------------------------
  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    try {
      const response = await fetch (`${apiUrl}/restaurant/${selectedRestaurant}`, { 
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      //console.log("Returning" ,data);
      setDisplayRestaurant(data);
    } catch (err) {
      setResponseMessage('Error searching restaurant');
    }
  };

  const handleAddRating = async() => {
    try {         
      const response = await fetch (`${apiUrl}/restaurant/updateRating/${selectedRestaurant}`, {
        method: 'PATCH',
        headers: {  
          'Content-Type': 'application/json',
        },    
        body: JSON.stringify({myRating: Number(myRating)}),
      });   
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Returning" ,data);
      setDisplayRestaurant(data);
    } catch (err) {
      setResponseMessage('Error searching restaurant');
    }       
  };

  

  return (
    <div className="App">
      <h1>Welcome, {username}!</h1>
      { /* Add Reservations */}
      <h3>Add Reservation</h3>
      <form onSubmit={handleSubmit}>
        {/*<input
          type="text"
          placeholder="Restaurant Name"
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          required
        />*/}
        <select
          value={selectedRestaurant}
          onChange={(e) => setSelectedRestaurant(e.target.value)}
          required
        >
          <option value="" disabled>Select a Restaurant</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant._id} value={restaurant.name}>
              {restaurant.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Party Number"
          value={party}
          onChange={(e) => setParty(e.target.value)}
          required
        />
        <input
          type="date"
          placeholder="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <input
          type="time"
          step= "1800"
          placeholder="Time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit">Add Reservation</button>
      </form>
      {responseMessage && <p>{responseMessage}</p>}

     

      { /* Display Reservations */}
      <div className="reservation-container">
        <h3>My Reservations</h3>

        {/* Searching */}
        <div className="search-container">
          <p>Search By Restaurant</p>
          <input
            type="text"
            placeholder="Restaurant Name"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
         {/* Filtering / Sorting*/}
        <div className="sort-container">
          <p>Sort By</p>
          <select value={category} onChange={handleSortChange}>
            <option value="">Select a filter</option>
            <option value="DateAsc">Date: ascending</option>
            <option value="DateDesc">Date: descending</option>
            <option value="PartyAsc">Party: ascending</option>
            <option value="PartyDesc">Party: descending</option>
          </select>
        </div>

        <div className="search-container" style={{ marginTop: "20px" }}>
        <p style={{color: 'black'}}>Search By Date Range</p>
        <div className="date-range-container">
          <label className="start-date">
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="end-date">
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        <button onClick={handleDateSearch}>Search</button>
        </div>
      </div>


        {/* Header Row */}
        <div className="reservation-header">
          <div>Restaurant Name</div>
          <div>Party</div>
          <div>Date</div>
          <div>Time</div>
          <div>Note</div>
          <div>Actions</div>
        </div>

        {/* Reservation Entries */}
        <div className="reservation-list">
          {reservations.map((reservation) => (
            <div key={reservation._id} className="reservation-item">
              <input type="text" value={reservation.restaurant} disabled />
              <input type="number" 
                /*editParty = {reservation.party}
                value={editParty} 
                readOnly = {false}
                onChange = {(e) => setEditParty({...editParty, [reservation._id]: e.target.value})}*/
                value={editData[reservation._id]?.party || reservation.party}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  [reservation._id]: { ...prev[reservation._id], party: parseInt(e.target.value) }
                }))}
               />
              <input type="date" 
                /*value={new Date(reservation.date).toISOString().split('T')[0]} 
                readOnly = {false}
                onChange = {(e) => setEditDate({...editDate, [reservation._id]: e.target.value})}*/
                value={editData[reservation._id]?.date || new Date(reservation.date).toISOString().split('T')[0]}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  [reservation._id]: { ...prev[reservation._id], date: e.target.value }
                }))}
               />
              <input type="time" 
                /*value={reservation.time} 
                readOnly = {false}
                onChange = {(e) => setEditTime({...editTime, [reservation._id]: e.target.value})}*/
                value={editData[reservation._id]?.time || reservation.time}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  [reservation._id]: { ...prev[reservation._id], time: e.target.value }
                }))}
               />
              <input type="text" 
                value={editData[reservation._id]?.note || reservation.note}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  [reservation._id]: { ...prev[reservation._id], note: e.target.value }
                }))}
               />

              {/*<button onClick={() => handleEdit(reservation._id,
                {party: parseInt(editParty),
                date: editDate,
                time: editTime,}
                
              )}> Edit</button>*/}

              <button onClick={() => handleEdit(reservation._id, editData[reservation._id] || {})}>Edit</button>
              <button onClick={() => handleDelete(reservation._id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>


      {/* Restaurants and ratings Section */}
       
      <h3>Restaurant Ratings</h3>
      <div className="add-restaurant-container">
        <p>Add A Restaurant</p>
        <form onSubmit={handleRestaurantSubmit}>
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            required
          >
            <option value="" disabled>Select a Restaurant</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant._id} value={restaurant._id}>
                {restaurant.name}
              </option>
            ))}
          </select>
          <button type="submit">Go!</button>
        </form>
      </div>

      <h3>Restaurant Details</h3>
      <div className="restaurant-header">
          <div className="header-item">
            <div className="header-label">Restaurant Name</div>
            <div className="header-value">{displayRestaurant.name}</div>
          </div>
          <div className="header-item">
            <div className="header-label">Rating</div>
            <div className="header-value">{displayRestaurant.rating}</div>
          </div>
          <div className="header-item">
            <div className="header-label">Number of Diners</div>
            <div className="header-value">{displayRestaurant.diners}</div>
          </div>
          <div className="header-item">
            <div className="header-label">My Rating</div>
            <div className="header-value">
                <select
                  value={myRating}
                  onChange={(e) => setMyRating(e.target.value)}
                  className="rating-dropdown"
                >
                  <option value="" disabled>Select Rating</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>
              <button onClick={handleAddRating}> Add </button>
            </div>
          </div>
        </div>

        <div className="my-restaurant-container">
          {/*<h3>My Restaurants</h3>

          
          <div className="my-restaurant-header">
            <div>Restaurant Name</div>
            <div>Rating</div>
            <div>Number of diners</div>
          </div>*/}
        </div>
        

    </div>

  );
}

export default App;
