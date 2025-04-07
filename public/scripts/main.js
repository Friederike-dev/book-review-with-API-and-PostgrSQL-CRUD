// ------------------------------------------------------- Padding for Header and Body
function adjustBodyPadding() {
  const header = document.querySelector("#header");
  const body = document.querySelector("body");
  if (header) {
    body.style.paddingTop = `${header.offsetHeight}px`;
  }
}

// -------------------------------------------------------- set padding
document.addEventListener("DOMContentLoaded", adjustBodyPadding);

// -------------------------------------------------------- set padding when resizing window
window.addEventListener("resize", adjustBodyPadding);

// -------------------------------------------------------- Read More Button 
function toggleText(itemId) {
  const textElement = document.getElementById(`text${itemId}`);
  const item = textElement.closest(".item"); // the closest parent item element
  const button = item.querySelector(".read-more-btn"); // select the button inside the item

  if (textElement.classList.contains("text-truncated")) {
    textElement.classList.remove("text-truncated");
    textElement.classList.add("text-expanded");
    item.style.maxHeight = "none"; // no height limit
    button.textContent = "Show less";
  } else {
    textElement.classList.remove("text-expanded");
    textElement.classList.add("text-truncated");
    item.style.maxHeight = ""; // reset to default height
    button.textContent = "Read more";
  }
}

// -------------------------------------------------------- New Review Button
function toggleNewItemForm() {
  const form = document.getElementById("new-item-form");
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
  if (form.classList.contains("visible")) {
    form.classList.remove("visible");
  } else {
    form.classList.add("visible");
  }
}


// -------------------------------------------------------- Search online Button
async function searchBook() {
  const title = document.getElementById("titleNew").value.trim();
  if (!title) {
    alert("Please enter a book title to search.");
    return;
  }
  try {
    const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`);
    const data = await response.json();
    if (data.docs && data.docs.length > 0) {
      const book = data.docs[0];
      console.log("Book data:", book);

      // we can use either the ISBN or cover_i for the Cover-URL
      const coverUrl = book.isbn
        ? `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`
        : book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : "";

      console.log("Cover URL:", coverUrl);

      const author = book.author_name ? book.author_name[0] : "Unknown Author";

      // show the cover image in the preview area
      const coverPreview = document.getElementById("bookCoverPreview");
      const coverInfo = document.createElement("p"); // Fallback information for no cover

      if (coverUrl) {
        coverPreview.src = coverUrl;
        coverPreview.style.display = "block"; // shows the image
        if (coverPreview.nextElementSibling) {
          coverPreview.nextElementSibling.remove(); // removes the previous info if it exists
        }
      } else {
        coverPreview.style.display = "none"; // hides the image
        if (!coverPreview.nextElementSibling) {
          coverInfo.textContent = "No cover available for this title.";
          coverInfo.style.color = "red";
          coverInfo.style.fontSize = "0.9rem";
          coverPreview.parentNode.appendChild(coverInfo);
        }
      }

      // fill the input fields with the book data
      document.querySelector("input[name='coverNew']").value = coverUrl || "No cover available";
      document.querySelector("input[name='authorNew']").value = author;

      alert(`Book found: ${book.title}\nAuthor: ${author}`);
    } else {
      alert("No book found with the given title.");
    }
  } catch (error) {
    console.error("Error fetching book data:", error);
    alert("An error occurred while searching for the book. Please try again.");
  }
}

// -------------------------------------------------------- Edit Button
function enableEdit(itemId) {
  const textElement = document.getElementById(`text${itemId}`);
  const item = textElement.closest(".item"); // the closest parent item element

  // save the original text except the "Review: " part
  const originalText = textElement.textContent.replace("Review: ", "").trim();
  
  const textarea = document.createElement("textarea");
  textarea.id = `textarea${itemId}`;
  textarea.name = "reviewText";
  textarea.className = "form-control mb-2";
  textarea.value = originalText; // we save the original text here
  textarea.setAttribute("data-original-text", originalText); // save the original text in a data attribute
  textElement.replaceWith(textarea);

  // add a button container below the textarea
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container mt-2"; // `mt-2` for top margin

  // add a Save button
  const saveButton = document.createElement("button");
  saveButton.className = "btn btn-save btn-primary me-2";
  saveButton.textContent = "Save changes";
  saveButton.onclick = function () {
    saveEdit(itemId);
  };

  // add a Cancel button
  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-cancel btn-secondary";
  cancelButton.textContent = "Cancel";
  cancelButton.onclick = function () {
    cancelEdit(itemId);
  };

  // add buttons to the button container
  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(cancelButton);

  // insert the button container after the textarea
  textarea.insertAdjacentElement("afterend", buttonContainer);
}

// -------------------------------------------------------- Save edited Text Button
  async function saveEdit(itemId) {
  const textarea = document.getElementById(`textarea${itemId}`);
  const updatedText = textarea.value.trim();

  // Send the updated text to the server
  const response = await fetch(`/edit/${itemId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reviewText: updatedText }),
  });

  if (response.ok) {
    // update the text element with the new text
    const textElement = document.createElement("p");
    textElement.id = `text${itemId}`;
    textElement.className = "text-truncated";
    textElement.innerHTML = `<strong>Review:</strong> ${updatedText}`;

    textarea.replaceWith(textElement);

    // remove the button container
    const buttonContainer = textElement.nextElementSibling;
    if (buttonContainer && buttonContainer.classList.contains("button-container")) {
      buttonContainer.remove();
    }
  } else {
    console.error("Error saving the updated review.");
  }
}
  // -------------------------------------------------------- Cancel editing Button
  function cancelEdit(itemId) {
    const textarea = document.getElementById(`textarea${itemId}`);
    const originalText = textarea.getAttribute("data-original-text"); // get hold of the original text
  
    // a new <p>-element like the one we had before
    const textElement = document.createElement("p");
    textElement.id = `text${itemId}`;
    textElement.className = "text-truncated";
    textElement.innerHTML = `<strong>Review:</strong> ${originalText}`; // use the original text
    textarea.replaceWith(textElement);
  
    // remove the button container
    const buttonContainer = textElement.nextElementSibling;
    if (buttonContainer && buttonContainer.classList.contains("button-container")) {
      buttonContainer.remove();
    }
  }