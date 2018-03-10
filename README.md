Yet Another Chat
================

Student Info
------------

Name: Dante Bencivenga

UCID: 10096414

GitHub Repository
-----------------
<https://github.com/bandgeekdante/SENG513A3>

Instructions
------------
1. Download or clone the above repository to a local folder
2. Navigate to that folder in your terminal and run the commands `npm install` followed by `node index` (install node.js if necessary)
3. The server should print the URLs for the website, e.g.

        Server is up and running on port 3000!  
        This device: Point browser to localhost:3000  
        Other devices on this network: Point your browser to 10.12.89.73:3000
4. Use the given URLs to connect to the chat application from any desktop or mobile device connected to the same local area network as the server
  * If external devices are not able to connect to the given IP, the server may have a firewall blocking incoming connections (check its network settings) or the IP may have changed since it started (check IP using either the operating system or by quitting the server using `ctrl+C` and restarting with `node index`)
  * Note that the command `/nickcolor` works with both named CSS colors, e.g. `/nickcolor blue` and hex values, e.g. `/nickcolor 0000FF`