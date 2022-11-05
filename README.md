# Curl-Terminal Chat App
[**DOWNLOAD ZIP**](https://github.com/spuckhafte/curl-chat#how)<br>
A global chat room from your terminal!<br>
Chat securely, anonymously, **globally** or in **privately in rooms**.

**Data sent and received from the server is [encrypted](https://github.com/spuckhafte/encdenc)!**

## Inbuilt commands
### General Cmds:
1. `/name=jhon` : set your name (not compulsory)
2. `/expose=0|1` : expose your name, can be found using id (0-false, 1-true)
3. `/whois=user_id` : find username using id (if exposed)
4. `/online=id|name` : get list of all active ids or names (if hidden, name will not appear, but id can)
5. `/me=` : see your data
5. `/help=` : see this list

### Room Cmds:
1. `/create={max_members}/{show_type(id|name)}` : create a `name or id type` private room (explained below).
2. `/join=room_id` : join a room
3. `/leave=` : leave a room
4. `/kick=user_id` : kick a user (only for host)

## Rooms
For your confidential messages, create private rooms.<br>
Cmd for creating one: `/create={max_members}/{show_type(id|name)}`<br>
eg. `/create=5/name`

### show_type (id|name)
If `show_type=id`, members can join your room without setting a proper name, or can even hide there names (`/expose=0`).<br>
![image](https://user-images.githubusercontent.com/70335252/200134396-6b1eece6-c853-4b80-ab55-b26bf05a4169.png)


If `show_type=name`, members will have to set their name using `/name`, otherwise they can't join. 
Even if they are hidden globally, their names still will be visible in your room when sending msg or in the `/online=name` list.
![image](https://user-images.githubusercontent.com/70335252/200134338-b281697a-1ad7-41fb-a88f-7791837ae548.png)


## How
1. Download this zip and open the only folder:
[curl-chat.zip](https://github.com/spuckhafte/curl-chat/files/9940660/curl-chat.zip)

2. Open `curl-updater.bat` file to get the latest update (compulsory for the first time).
3. Open `curl.bat` => main file.
