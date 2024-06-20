NextJS project and problem solving regrading that project
- adding the real time chat feature in the project so project members can talk to each other about the success of project and future task and issues related to the task and let's see how can i do that ?

let's see what we need to add now more to this 
- Fix the UI of the Members section where we would be changing the UI of the chat button 

Fixing the UI of the chat page and adding some styles over it 
- fixing the UI of the header of the chat which contains user data with whom user is chatting with right now 
- adding the status show for the person we ae talking to with the uid being passed inside a useEffect and passing message user document on the snapshot listen so it can listen for the data change on it which is it's status value 

updating the main context of the chat interface where the user would be able to see the chat message send them 
- let's style the main input box and position it at the bottom of the chat page and then styles the text chat boxes for the user 
- styles still giving me some issues that i need to fix for now 
- adding the seen or not with the new stuff 
- adding the scroll feature  to hear for the chat message div and change it's uid 

Adding the edit function for the  and the finish function for the task 
- adding the finish function for the task by adding up the task Status changed with Status 
- adding the edit function 

Edit function for the task let's see how we can add it and what changes i need to add 
- things that can be altered by the edit function
const task = {
            'Heading': heading,  altered
            'Description': description,  altered
            'CreatedBy': uid,
            'Deadline': '',  altered
            'CreatedAt': created_at,  // current date in dd/mm/yy format
            'Assignies': assigneeMap,  altered
            'Project': projectId,
            'Files': fileObject,  // associated files   altered
            'CreatorImage': await getCreatorImage(uid),
            'AssignieesImages': await getAssignieesImageUrls(assignies) altered [ as assignee changes image url for that assignee also changes ]
 };

- stlying the request page for the user who wan't to come to the project
- styling the message button of the members 

Member person is not been able to access the project or the project is not showing to him so he is not been able to enter in the project let's see how can we fix this 
- checking the landing page and seeing what is the issue with that
- Possible solution
Problem
- the code is not been able to distinguish between the creator and the member of the same project 
let's use the create by function checkup from the list of documents 
Issue -
in the first document we are thinking that we can join many projects thus it will going to fail us in the second case cause on that the user doc does not have any key like that
Possible solution - 
- Add the Projects key in the member as well if you are making it as a multi project application where users can have access to different prjects at a given time 
- make the projects delete from the creator doc and remove it and alter whose codebase from the projects itself 

Added the multi project access so now the project have the multi level access for the members 
Member level Issues - 
- On the member level we have to add some styles to the landing page first 
- Member section is not showing some good data for the member to chat with [ it should not show me the id me in the message section to message about 
- adding the sorting feature in the message retrieval task le't see the message structure 
[ 
we have to add date also in dd/mm/yy format that can be used both sorting the text's and showing distinct block of mesages that are sent over the time with their defined dates 
we have to remove my uid from the id's collection that we have 
add current date format for the chat message to sort them out in the  let's see how we can do that 


Current new issue that we need to fix 
- Status bar for the chat input that we need to fix to show if the user who we are talking to is active or not [ fixed ]
- Showing the date also for the new chat in the chat message box 
- adding the auto scroll feature for the application chat box 
- adding the seen / unseen feature [ working on this for now ]
- adding the delete message feature for the chat
- adding the upload file feature for the chat box as an extra feature to share with the users 
