# PINGTIME

>[!CAUTION]
>Due to privacy problem the previous API have been sostituted with simple JSON only for demonstration.

PingTime is an application developed for the "Models and Alghoritms For Data Visualization" exam.

> [!NOTE]
> This project is made by Mirko Bruschi, Michele Dalmonte and me.
> These version is the exam one, but the project is evolving, check for last release here: https://github.com/0101mirko1010/PingTimeVis

# INTRODUCTION

This project was designed for a table tennis club. The app's goal is to provide the club with tools to efficiently analyze attendance, absences, and cancellations, maximizing time slot utilization and promoting better training through informed matchmaking.

There are two main categories of users PingTime is aimed at:

- Company Boards
- Coaches

# DATA MODELLING

### DATA GATHERING AND DATA EXTRACTION

This two parts are interely carried by the Backend Part of the application. In fact the data are very structured data stored in a real relational database.

### DATA CLEANING

This part is carried by the Backend API. The API return only the desired data.

### DATA TRASFORMATION

This part is provided from both the Backend and Frontend. An example of the transformation is the aggregation of attendance in a certain time period.

### DATA TYPES AND DATASET TYPES

The data types are for the major part quantitative, but the are also categorical data.
There are instead two types of dataset and in particular tables and network ones.

# TASK MODELLING

The application should handle these task:

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

- Identify players with poor interaction with other players
- Verify with players with lot of training play with different players every time
- Monitoring evolution of social hub through the weeks
- Support conscious mathcmaking to make heterogeneus groups

# VISUALIZATION DESIGN

The visual idioms choose for this application are mainly three:

- Calendar HeatMap
- Line Chart
- Radial Chart

#### Calendar HeatMap

It is a bidimensional Chart which have on the X-Axis the hours of a day and on the Y-Axis the week days, the month weeks or the year months depend on the type of resolution is necessary.
<br/>
<br/>

>**Marks:** Rectangular area
><br/>
>**Channels:** Position X, Position Y and Color (gray to orange)

#### Line Chart

In this visual idiom on the x-Axis there are the weeks and on the y-Axis the quantitative attribute of attendences, absences and cancellations.
<br/>
<br/>
>**Marks:** Point, Line (continuos or scattered)
><br/>
>**Channels:** Position X, Position Y and color

#### Radial Chart

Here the angular position means nothing, while the radial distance from the origin simbolize the quantitative of heterogenous match played with different players in the week. An higher value of heterogenous match is a good value and it is displayed newar the origin while a bad value is displayed far from the origin.
<br/>
<br/>
>**Marks:** circle area
><br/>
>**Channels:** Radial position and color

# INTERACTION DESIGN
Let's report all type of interaction for each visual idioms:

#### Calendar HeatMap
In this chart there are 5 types of interaction:
- Zooming (with mouse wheel) in the chart increase/decrease the hour resolution
- Dragging (with mouse) in the chart permit to move along x axis
- Dragging (with mouse) or scrolling (with mouse wheel) over the y-axis permit to change the weeks/months/years time period
- Hovering a cell (with mouse pointer) permit to obtain major details (detail on demand) and in particular number and names of the players

#### Line Chart

In this chart there are 5 types of interaction:
- Clicking on two date generate all metrics among this date
- Clicking on the legend metrics permit to hide or show that metrics (a rescaling could happen)
- Double clicking reset all chart


#### Radial Chart

In this chart there are 6 types of interaction:
- Zooming (with the mouse wheel) in the chart permit to zoom in/out the view (the center of zooming is always the origin)
- Hovering a node pop out the name of the player
- Hovering a circle pop out the number of player on that circle (of that value)
- Clicking on a node pop out information about interaction of other players through a change of color and depending on the modality
- Cliking on a node mantain a reference in the other chart (coordinated views)
- Clicking out reset all colors


# EXAMPLES
