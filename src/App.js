import React, { useRef, useState } from 'react';
import './App.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");


firebase.initializeApp({
  apiKey: "AIzaSyDcuAagIScxjfsi_A_PhmlGbKSeTHE4sEo",
  authDomain: "acmc-298f1.firebaseapp.com",
  projectId: "acmc-298f1",
  storageBucket: "acmc-298f1.appspot.com",
  messagingSenderId: "334002705680",
  appId: "1:334002705680:web:b3744d94e4463b956b4195"
})

const client = new TextAnalyticsClient("https://acmc-resources.cognitiveservices.azure.com/", new AzureKeyCredential("f9afa602507b41c986fa6f6d42de0b1a"));

const auth = firebase.auth();
const firestore = firebase.firestore();



function App() {

  const [user] = useAuthState(auth);

  return (
    <>
        <div className="App">
      <header>
        <img src="https://swimburger.net/media/ppnn3pcl/azure.png"
        width={50}
        height={50}
        alt="Azure Logo"
        className='image'
        />
        <SignOut />
      </header>

      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>

    </div>
    </>
  );
}

function SignIn() {

  const signInWithMs = () => {
    let provider = new firebase.auth.OAuthProvider('microsoft.com');
      provider.setCustomParameters({
     prompt: "consent",

})
    auth.signInWithPopup(provider);
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithMs}>Sign in with Microsoft</button>
      {/* <button className="sign-in" onClick={signInWithMs}>Sign in with Google</button> */}
     
    </>
  )

}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}


function ChatRoom() {
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(25);

  const [messages] = useCollectionData(query, { idField: 'id' });

  const [formValue, setFormValue] = useState('');

  
  const sendMessage = async (e) => {

    e.preventDefault();
  
    // Analyze sentiment
    const response =  await client.analyzeSentiment([
      formValue
    ]);
  
    if(response[0].sentiment === "negative") {
      alert("Message blocked due to negative sentiment ");
      return;
    }
  
    // Check for toxic content
    const toxicityResponse = await client.analyzeSentiment([
      formValue  
    ]);
    
    if(toxicityResponse.isToxic) {
      alert("Message blocked due to toxic content");
      return;
    }
  
    // message is ok, continue with send
  
    const { uid } = auth.currentUser;
  
    await messagesRef.add({
      username: auth.currentUser.displayName, 
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid  
    })
  
    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  
  }

  return (<>
    <main>

      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}

      <span ref={dummy}></span>

    </main>

    <form onSubmit={sendMessage}>

      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="say something nice" />

      <button type="submit" disabled={!formValue}>🕊️</button>

    </form>
  </>)
}


function ChatMessage(props) {
  const { text, uid, username} = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
  <>

   <div>
    <div className={`message ${messageClass}`}>
    <div className='usernamecontainer'>
    <span className='username'>{username}</span>
    </div> 
      <p>{text}</p>
    </div>
    
    </div>
  </>)
}


export default App;
