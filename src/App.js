import React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";
import TextField from "monday-ui-react-core/dist/TextField.js";
import Flex from "monday-ui-react-core/dist/Flex.js";
import Dropdown from "monday-ui-react-core/dist/Dropdown.js";
import Button from "monday-ui-react-core/dist/Button.js";
import Toast from "monday-ui-react-core/dist/Toast.js";

// Usage of mondaySDK example, for more information visit here: https://developer.monday.com/apps/docs/introduction-to-the-sdk/
const monday = mondaySdk();

const App = () => {
  const [_context, setContext] = useState();
  const [fragrances, setFragrances] = useState([]);

  // values to create a new order
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [selectedFragrance, setSelectedFragrance] = useState([]);
  // Feedback toast on order creation
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");

  const fetchFragrances = async () => {
    try {
      const response = await fetch("http://localhost:3000/fragrance");
      const data = await response.json();

      // Turn the data into an array of objects that the dropdown component can understand
      // TODO: Change the value and label to return from the API
      data.forEach((fragrance) => {
        fragrance.value = fragrance.name;
        fragrance.label = fragrance.name;
      });

      setFragrances(data);
    } catch (error) {
      console.error(error.message);
    }
  };

  const createOrder = async () => {
    // Validate the fields before creating the order
    if (!validateFields()) {
      return;
    }

    try {
      // Format the selected fragrances for the dropdown column
      const fragrancesToSend = selectedFragrance
        .map((frag) => frag.value)
        .join(", ");

      // Board Id "7302640219" is the board id of the "Production Orders" board for candles
      const createOrder = await fetch("https://api.monday.com/v2", {
        method: "POST", // POST for GraphQL queries
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.REACT_APP_API_KEY,
          "API-Version": "2023-04",
        },
        // Create item mutation for the "Production Orders" board for the New Order group
        body: JSON.stringify({
          query: `
            mutation {
              create_item(
                board_id: 7302640219, 
                group_id: "topics", 
                item_name: "New Order for ${firstName + " " + lastName}", 
                column_values: "{\\"status\\":\\"New Order\\", \\"numbers\\":\\"${quantity}\\", \\"dropdown\\": \\"${fragrancesToSend}\\", \\"date_1\\":\\"${
            new Date().toISOString().split("T")[0]
          }\\"}") {
                  id
              }
            }
          `,
        }),
      });

      const orderData = await createOrder.json();
      console.log(orderData);

      // Show a toast message to the user
      setToastOpen(true);
      setToastMessage("Your order has been successfully created.");
      setToastType("positive");

      // Reset the form fields
      setFirstName("");
      setLastName("");
      setQuantity(0);
      setSelectedFragrance([]);
    } catch (error) {
      // Show a toast message to the user on error
      setToastOpen(true);
      setToastMessage(
        "There was an error creating your order. Please try again."
      );
      setToastType("negative");
      console.error(error.message);
    }
  };

  const validateFields = () => {
    if (firstName === "" || lastName === "" || quantity === 0) {
      setToastOpen(true);
      setToastMessage("Please fill out all fields.");
      setToastType("negative");
      return false;
    }

    if (selectedFragrance.length === 0) {
      setToastOpen(true);
      setToastMessage("Please select a fragrance.");
      setToastType("negative");
      return false;
    }

    return true;
  };

  useEffect(() => {
    fetchFragrances();
  }, []);

  useEffect(() => {
    // Notice this method notifies the monday platform that user gains a first value in an app.
    // Read more about it here: https://developer.monday.com/apps/docs/mondayexecute#value-created-for-user/
    monday.execute("valueCreatedForUser");

    // TODO: set up event listeners, Here`s an example, read more here: https://developer.monday.com/apps/docs/mondaylisten/
    monday.listen("context", (res) => {
      setContext(res.data);
    });
  }, []);

  return (
    <div className="app-main">
      <Flex style={{ width: "100%" }} justify={Flex.justify.SPACE_BETWEEN}>
        <TextField
          placeholder="Enter Customer First Name"
          size={TextField.sizes.LARGE}
          title="First Name"
          wrapperClassName="text-field"
          onChange={(value) => setFirstName(value)}
          value={firstName}
        />
        <TextField
          placeholder="Enter Customer Last Name"
          size={TextField.sizes.LARGE}
          title="Last Name"
          wrapperClassName="text-field"
          onChange={(value) => setLastName(value)}
          value={lastName}
        />
        <TextField
          placeholder="Quantity"
          size={TextField.sizes.LARGE}
          title="Quantity"
          type={TextField.types.NUMBER}
          wrapperClassName="text-field"
          onChange={(value) => setQuantity(value)}
          value={quantity}
        />
      </Flex>
      <Flex style={{ width: "100%", marginTop: "10px" }}>
        {fragrances.length > 0 ? (
          <Dropdown
            placeholder="Choose a fragrance"
            options={fragrances}
            multi
            multiline
            searchable
            size={"large"}
            className="dropdown"
            li
            onChange={(selected) => {
              if (selected?.length > 3) {
                setToastOpen(true);
                setToastMessage("You can only select up to 3 fragrances.");
                setToastType("negative");
                return;
              }
              setSelectedFragrance(selected);
            }}
            value={selectedFragrance}
          />
        ) : (
          <div>Loading...</div>
        )}
      </Flex>

      <Flex style={{ width: "100%", marginTop: "10px" }}>
        <Button onClick={createOrder}>Start Order</Button>
      </Flex>
      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        type={toastType}
        autoHideDuration={3000}
      >
        {toastMessage}
      </Toast>
    </div>
  );
};

export default App;
