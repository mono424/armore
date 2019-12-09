import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import hotkeys from "hotkeys-js";

import storage from '../../services/storage';
import "./style.css";

function FuzzyOpen(props) {
  const {
    onDelete = () => {},
    onSelect = () => {},
    onClose = () => {}
  } = props;
  const [query, setQuery] = React.useState("");
  const [files, setFiles] = React.useState(storage.files());
  const items = Object.keys(files);
  const itemsFiltered = items.filter(i => query === '' || i.replace(query, '') !== i);

  const deleteHandler = (e, item) => {
    e.stopPropagation();
    onDelete(item);
    setFiles(storage.files());
  };

  React.useEffect(() => {
    // Focus on textbox
    document.querySelector(".FuzzyOpen .search input").focus();

    hotkeys('esc', {
      element: document.querySelector(".FuzzyOpen .search input"),
    }, (e) => {
      e.preventDefault();
      onClose();
    });
  }, [])

  hotkeys.unbind('enter', 'fuzzyopen');
  hotkeys('enter', {
    scope: 'fuzzyopen',
    element: document.querySelector(".FuzzyOpen .search input"),
  }, (e) => {
    e.preventDefault();
    itemsFiltered.length && onSelect(itemsFiltered[0]);
  });

  return (
    <div className="FuzzyOpen" onClick={onClose}>
      <div className="search" onClick={e => e.stopPropagation()}>
        <input value={query} onChange={e => setQuery(e.target.value)} />
        {!itemsFiltered.length && (
          <div class="nothing-found">No items found.</div>
        )}
        {!!itemsFiltered.length && (
          <ul>
            {itemsFiltered.map(item => (
              <li key={item} onClick={() => onSelect(item)}>
                <FontAwesomeIcon icon="file" className="icon" />
                {item}
                <FontAwesomeIcon
                  icon="trash"
                  className="trash"
                  onClick={e => deleteHandler(e, item)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FuzzyOpen;
