# PINGTIME
PingTime is an application developed for the "Models and Alghoritms For Data Visualization" exam.
>[!CAUTION]
>Due to privacy problem the previous API have been sostituted with simple JSON only for demonstration.



> [!NOTE]
> This project is made by Mirko Bruschi, Michele Dalmonte and me.
> These version is the exam one, but the project is evolving. Check for the last release here: https://github.com/0101mirko1010/PingTimeVis

<br/>
<br/>

# 1. Initialization
To start the application launch the following command from PingTime folder.

In WINDOWS:
> ./install.bat 
> <br/>
> ./start.bat

In LINUX:
> sh install.sh
> <br/>
> sh start.sh

Or start and install dependencies manually. <br/>
Starting backend and database as follow:

 > cd MY_PATH/PingTime/backend
> <br/>
 > npm install
> <br/>
 > node index.js

Starting frontend as follow:

> cd MY_PATH/PingTime/frontend
> <br/>
> npm install
>  <br/>
> npm start

<br/>
<br/>


# 2. Introduction

This project was designed for a table tennis club. The app's goal is to provide the club with tools to efficiently analyze attendance, absences, and cancellations, maximizing time slot utilization and promoting better training through informed matchmaking.

There are two main categories of users PingTime is aimed at:

- Company Boards
- Coaches

<br/>

# 3. Data modeling

## 3.1 Data gathering and data extraction
This two parts are interely carried by the Backend Part of the application. In fact data are very structured and stored in a real relational database.

## 3.2 Data cleaning

This part is carried by the Backend API. The API return only desired data.

## 3.2 Data transformation

This part is provided from both the Backend and Frontend. An example of the transformation is the aggregation of attendance in a certain peeriod of time.

## 3.3 Data types and dataset types

Data types are for the major part quantitative, but there are also categorical data.
There are instead two types of dataset and in particular tables and network ones.

<br/>

# 4. Task modeling

The application should handle these tasks:

- Find empty interval time in the gym
- Identify interval time with low usage
- Compare gym usage among weeks, months or years
- Analyze a specific interval time
  
<br/>

- Monitoring attendences, absences and cancellations trends
- Compare attendences, absences and cancellations through different periods of time
- Analyze training trends of a specific athlete
- Identify values anomalies in terms of attendances, absences and cancellations
- Valutate the efficiency of new policies comparing precendent and successive time period metrics (attendences, absences and cancellations)
  
<br/>

- Identify players with poor interactions with other players
- Verify players with lot of training play with different players every time
- Monitoring the evolution of social hub through weeks
- Support conscious mathcmaking to make heterogeneus groups

<br/>

# 5. Visualization design

The visual idioms chosen for this application are mainly three:

- Calendar HeatMap (check spaces organizations)
- Line Chart (check attendences, absences and cancellations trends)
- Radial Chart (check players interactions)

## 5.1 Calendar HeatMap

It is a bidimensional Chart which have on the X-Axis the hours of a day and on the Y-Axis week days, the month weeks or the year months depend on the type of resolution is necessary.
<br/>
<br/>

>**Marks:** Rectangular area
><br/>
>**Channels:** Position X, Position Y and Color (gray to orange)

## 5.2 Line Chart

In this visual idiom on the x-Axis there are the weeks and on the y-Axis the quantitative attribute of attendences, absences and cancellations.
<br/>
<br/>
>**Marks:** Point, Line (continuos or scattered)
><br/>
>**Channels:** Position X, Position Y and color

## 5.3 Radial Chart

Here the angular position means nothing, while the radial distance from the origin simbolize the quantitative of heterogenous match played with different players in the week. An higher value of heterogenous match is a good value and it is displayed closer to the origin while a bad value is displayed further from the origin.
This visual idiom has been choosen because a classical network design generates a lot of crossings among edges (the graph is strongly connected) and could be chaotic.
<br/>
<br/>
>**Marks:** circle area
><br/>
>**Channels:** Radial position and color

<br/>

# 6. Interaction design
Let's report all types of interaction for each visual idiom:

## 6.1 Calendar HeatMap
In this chart there are 5 types of interaction:
- Zooming (with the mouse wheel) in the chart increases/decreases the hour resolution
- Dragging (with the mouse) in the chart permits to move along x axis
- Dragging (with the mouse) or scrolling (with the mouse wheel) over the y-axis permits to change the weeks/months/years time period
- Hovering a cell (with the mouse pointer) permits to obtain more details (detail on demand) and in particular number and names of the players

## 6.2 Line Chart

In this chart there are 5 types of interaction:
- Clicking on two or more dates generates all average metrics among themselves
- Clicking on the legend metrics permits to hide or show those metrics (a rescaling could happen)
- Double clicking resets all chart


## 6.3 Radial Chart

In this chart there are 6 types of interaction:
- Zooming (with the mouse wheel) in the chart permits to zoom in/out the view (the center of zooming is always the origin)
- Hovering a node pops out the name of the player
- Hovering a circle pops out the number of player on that circle (of that value)
- Clicking on a node pops out information about interaction of other players through a change of color and depending on the modality
- Cliking on a node mantains a reference in the other chart (coordinated views)
- Clicking out resets all colors

<br/>

# 7. Architectural and technological design
The entire app is based on the following structure:
- React.js as frontend framework
- D3.js as visual idioms technologies
- PHP as backend (API also)
- MySQL as database
- JSON and CSV as communication formats

<br/>

# 8. Alghoritm engineering
The main algorithm used in this app is the Dijkstra one.
It is used to calculate the shortest path among every pair of vertices of the players network.
The original idea was to realize a force directed layout based on the theoric distance, but this is only going to be done in the future.
Dijkstra is currently used as an attachment point for future visual idiom.
As Dijkstra is currently implemented it is used for other 2 purposes:
- Get Adjacent Matrix (if two players have shortest path with weight 1 they are directly connected)
- Get connected component (if the path has weight infinity the two players are in two different connected components)

  <br/>
  
# 9. Add on
Another visual idiom has been added to the app as a sort of index or fast news. This idiom is called KPIcards.

<br/>

# 10. Examples

#### KPICards

![image](https://github.com/DavideFast/University/blob/main/PingTime/README_img/KPICards.png)

#### Calendar HeatMap

![image](https://github.com/DavideFast/University/blob/main/PingTime/README_img/HeatMap.png)

#### Line Chart


![image](https://github.com/DavideFast/University/blob/main/PingTime/README_img/LineChart.png)

#### Radial Chart


![image](https://github.com/DavideFast/University/blob/main/PingTime/README_img/RadialBar.png)

<br/>
