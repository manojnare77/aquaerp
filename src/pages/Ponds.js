import React, { useState, useEffect } from 'react';
import '../App.css';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { listPonds } from '../graphql/queries';
import { createPonds as createPondsMutation, deletePonds as deletePondsMutation} 
  from '../graphql/mutations';

import { Amplify } from 'aws-amplify';
import { API, Storage } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';

import awsExports from '../aws-exports';
Amplify.configure(awsExports);

const initialFormState = { pond_area: '', pond_no: 0, pond_name: '', capacity: '' }

function Ponds() {

  const [ponds, setPonds] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchPonds();
  }, []);

  async function fetchPonds() {
    const apiData = await API.graphql({ query: listPonds });
    const pondsFromAPI = apiData.data.listPonds.items;
    await Promise.all(pondsFromAPI.map(async pond => {
      if (pond.image) {
        const image = await Storage.get(pond.image);
        pond.image = image;
      }
      return pond;
    }))
    setPonds(apiData.data.listPonds.items);
  }

  async function createPonds() {
    if (!formData.pond_area || !formData.pond_no || !formData.pond_name|| !formData.capacity) return;
    await API.graphql({ query: createPondsMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setPonds([ ...ponds, formData ]);
    setFormData(initialFormState);
  }

  async function deletePonds({ id }) {
    const newPondsArray = ponds.filter(ponds => ponds.id !== id);
    setPonds(newPondsArray);
    await API.graphql({ query: deletePondsMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchPonds();
  }

  return (
    <div className="App">
      <h1>Ponds Details</h1>
      <table className="table table-striped">
      <tbody>
        <tr>
        <td>
            <input
              onChange={e => setFormData({ ...formData, 'pond_area': e.target.value})}
              placeholder="Ponds Area"
              value={formData.pond_area}
            />
          </td>          
          <td>
            <input
              onChange={e => setFormData({ ...formData, 'pond_no': e.target.value})}
              placeholder="Ponds No"
              value={formData.no}
            />
          </td>
          <td>
            <input
              onChange={e => setFormData({ ...formData, 'pond_name': e.target.value})}
              placeholder="Pond Name"
              value={formData.pond_name}
            />
          </td>
          <td>
            <input
              onChange={e => setFormData({ ...formData, 'capacity': e.target.value})}
              placeholder="Ponds Capacity"
              value={formData.capacity}
            />
          </td>
          <td>      
            <input
              type="file"
              onChange={onChange}
            />
          </td>
          <td><button onClick={createPonds}>Create Pond</button></td>      
        </tr>

      </tbody>
    </table>

      <table className="table table-striped">
                  <thead>
            <tr>
              <th width="15%">Ponds Area</th>
              <th width="10%">Ponds No</th>
              <th width="15%">Ponds Name</th>
              <th width="10%">Ponds Capacity</th>
              <th width="40%">Ponds Image</th>
              <th width="10%">Action</th>
            </tr>
          </thead>
      </table>

      <div style={{marginBottom: 30}}>
              {
                ponds.map(ponds => (
                  <div key={ponds.id}>
                  <table className="table table-striped">
                  <tbody>
                    <tr>
                      <td width="15%">{ponds.pond_area}</td>
                      <td width="10%">{ponds.pond_no}</td>
                      <td width="15%">{ponds.pond_name}</td>
                      <td width="10%">{ponds.capacity}</td>
                      <td width="40%">{ponds.image 
                      ? <img src={ponds.image} style={{width: 250}} alt="Pond"/> 
                      : <span>No Image Added</span>}</td>
                      <td width="10%">
                        <button onClick={() => deletePonds(ponds)}>Delete</button></td>
                    </tr>
                  </tbody>
                  </table>
      </div>
          ))
        }
      </div>
    </div>
  );
}

export default withAuthenticator(Ponds);