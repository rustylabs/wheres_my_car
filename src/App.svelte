<script lang="ts">
  import {emojis, ui_color_defs, notification_alerts_mins, msg_warning, msg_critical} from './structures';
  import type {InputValues, AppColor} from './structures';
  import {onMount} from 'svelte';
  import {getLocation, latitude, longitude, return_formatted_time, get_time_remaining, display_time_remaining, notification, cancel_notification, notification_channel_config,
    JsonHandler, timed_parking_change} from './functions'
  
  import {App} from '@capacitor/app';
  import {BackgroundTask} from '@capawesome/capacitor-background-task';


  const json_handler = new JsonHandler()

  function cancel_reminders()
  {
    cancel_notification(msg_warning.id)
    cancel_notification(msg_critical.id)
  }

  //import {App} from '@capacitor/app';

  // How much everything moves from the left?
  const margine_left = 8;


  let is_timed_parking = true;

  interface TimeRemaining
  {
    mins_remaining: number,
    time_remaining_display: string,
  }
  let time_remaining: TimeRemaining = 
  {
    mins_remaining: 0,
    time_remaining_display: "",
  }

  //let tmp = false;
  // Executes every minute
  function every_minute()
  {
    if (edit_mode == false && input_values.timed_parking != null)
    {
      //tmp = true;
      //notification("test", "is running", null, 2)

      time_remaining.mins_remaining = get_time_remaining(input_values.parked_time, input_values.timed_parking*60)
      time_remaining.time_remaining_display = display_time_remaining(input_values.parked_time, time_remaining.mins_remaining)

      // Clear everything
      if (time_remaining.mins_remaining <= -10)
      {
        //json_handler.delete()
        init(true)
        //App.exitApp();
      }
    }
  }

  onMount(() =>
  {
    const intervalId = setInterval(every_minute, 60000);
    
    //set_location();
    
    return () => clearInterval(intervalId);
  })

  async function run_in_background()
  {
    const taskId = await BackgroundTask.beforeExit(async () =>
    {

      //notification(msg_warning.title, msg_warning.msg, msg_warning.icon, null, 1000);
      //notification(msg_warning.title, msg_warning.msg, msg_critical.icon, 10, 2000);

      const warning_msg_time = time_remaining.mins_remaining - notification_alerts_mins[0];
      const critical_msg_time = time_remaining.mins_remaining - notification_alerts_mins[1];

      if (input_values.timed_parking != null)
      {
        if (time_remaining.mins_remaining > notification_alerts_mins[0])
        {
          //notification(msg_warning.title, "mins_remaining: " + time_remaining.mins_remaining, 5, msg_warning.id);
          notification(msg_warning.title, msg_warning.msg, msg_warning.icon, warning_msg_time*60, msg_warning.id);
        }
        if (time_remaining.mins_remaining > notification_alerts_mins[1])
        {
          //notification(msg_critical.title, "critical_msg_time: " + critical_msg_time, 10, msg_critical.id);
          notification(msg_critical.title, msg_critical.msg, msg_critical.icon, critical_msg_time*60, msg_critical.id);
        }
        
      }

      //notification("1st", "" + input_values.timed_parking, 5, msg_warning.id)
      //notification("1st", "1st", 5, msg_warning.id)
      //notification("2nd", "2nd", 10, msg_critical.id)

    })

    BackgroundTask.finish({taskId});
  }
  // ALso saves into json
  function toggle_edit_mode()
  {
    edit_mode = !edit_mode;

    // If running
    if (edit_mode == false)
    {

      run_in_background()

      json_handler.write(input_values)
      //json_handler.read(input_values)

      every_minute()
    }
    // When go back to edit mode
    else
    {
      cancel_reminders()
    }
  }
  function select_parking_type(event: Event)
  {
    const target = event.target as HTMLInputElement;
    input_values.parking_type = target.value;

    if (input_values.parking_type != "Westfield")
    {
      input_values.parking_level = null
    }
    else
    {
      input_values.parking_level = westfield_parking_levels[1]
    }
    
    //notification("parking_type", "parking_type: " + input_values.parking_type, null, 1000)
  }
  function set_timed_hours(event: Event)
  {
    const target = event.target as HTMLInputElement;
    input_values.timed_parking = parseInt(target.value, 10);
  }
  // After pressing on the gps button it will open the link up where the lats and longs are saved
  function open_maps()
  {
    if (input_values.gps_location != null)
    {
      window.open(input_values.gps_location[0], "_blank");
    }
  }

  const free_hours = [1,2,3,4,5,6];

  const westfield_parking_levels = ["Level 2", "Level 3", "Level 3 (Upper)", "Level 4", "Level 4 (Upper)", "Level 5", "Level 5 (Upper)", "Level 6"];

  function set_parking_level(event: Event)
  {
    const target = event.target as HTMLInputElement;
    input_values.parking_level = target.value;
  }

  function set_parking_note(event: Event)
  {
    const target = event.target as HTMLInputElement;
    input_values.notes = target.value;
  }

  let edit_mode: boolean;
  let app_color: AppColor = {primary: "#d84c3c", secondary: "#d84c3c", background: "#ffffff"};
  let parking_types = ["Westfield", "Other Shopping Centre", "Other"];

  //onMount(init);
  // Invoked in places such as delete button and if time is above the time limit or for the first time

  function init_input_fields()
  {
    const current_time = new Date();
    //json_handler.delete();
    input_values = 
    {
      parking_type: parking_types[0],
      parking_level: westfield_parking_levels[1],
      parked_time: new Date(current_time.getTime() - 5 * 60 * 1000),
      timed_parking: 4,
      gps_location: null,
      notes: null,
      //run_in_background: false,
    }
    //set_location()
  }

  let input_values: InputValues;
  function init(reset: boolean)
  {
    is_timed_parking = true;

    //getLocation();
    //const coordinates = await getLocation();

    // If we want to repopulate the input_input_fields run this
    init_input_fields()

    if (reset == true)
    {
      json_handler.delete()
      cancel_reminders()
      edit_mode = true;
      set_location()
    }
    // If we are launching the app and want to resume
    else
    {
      edit_mode = false;

      json_handler.read().then((res) =>
      {
        // Load json saved data into variables
        if (res != null)
        {
          // Contains all the json saved data
          const tmp = JSON.parse(res) as InputValues

                  
          input_values.gps_location = tmp.gps_location
          //input_values.parked_time = tmp.parked_time // Culprit, freezes app
          input_values.parked_time = new Date(tmp.parked_time);
          input_values.parking_level = tmp.parking_level
          input_values.parking_type = tmp.parking_type
          input_values.timed_parking = tmp.timed_parking
          input_values.notes = tmp.notes

          // is_timed_parking determination
          if (input_values.timed_parking == null)
          {
            is_timed_parking = false;
          }

          every_minute()
        }
        else
        {
          edit_mode = true;
        }


      }).catch(_ =>
      {
        edit_mode = true;
      })
      //notification("parking_type", "parking_type: " + input_values.parking_type, null, 1000)
    }
    

  }

  function set_location()
  {
    getLocation().then((res) =>
    {
      console.log("res ", res)
      input_values.gps_location = [`https://www.google.com/maps?q=${res.latitude},${res.longitude}&z=14`, [res.latitude, res.longitude]]
    }).catch(e => console.log(e));
  }

  notification_channel_config()

  init(false)

  /*
  init(false).then(() => {
    //notification("Debug", "edit_mode: " + edit_mode, null, 99)
  }).catch(error => {
    notification("Error", "Error init: " + error, null, 110);
  });
  */
  $: 
  {
    //notification("Debug", "input_values_tmp.parking_level: " + input_values.parking_level, null, 99)
  }
  

  



</script>

<main>
  <!--<nav style={`background-color: ${app_color.primary}; margin-top: -10px; color: white; padding: 15px; margin-left: -10px; font-weight: bold; width: 100%`}>-->
  <nav style={`background-color: ${app_color.primary};`}>
    <ul>
      <li>Where's My Car</li>
    </ul>
  </nav>

  <!--<img src="images/app_icon.png" alt="img cannot be loaded up" style="width: 30px; position: absolute; top: 5px; left: 130px;">-->

  <br>
  <select on:change={select_parking_type} value={input_values.parking_type} disabled={!edit_mode}>
    {#each parking_types as parking_type}
      <option value={parking_type}>{parking_type}</option>  
    {/each}
  </select>
  (Parking type)
  <!--Will show the parking paramaters-->
  <div>
    {#if input_values.parking_type == "Westfield"}
      <!--Show dropdown list of levels you have parked vehical-->
      <select on:change={set_parking_level} value={input_values.parking_level} disabled={!edit_mode}>
        {#each westfield_parking_levels as westfield_parking_level}
          <option value={westfield_parking_level}>{westfield_parking_level}</option>
        {/each}
      </select>
      (Level)
    {:else if input_values.parking_type == "Other Shopping Centre"}
      <input placeholder="What level" on:input={set_parking_level} value={input_values.parking_level} disabled={!edit_mode}>
      (Level)
    {/if}
    
    <p style={`margin-left: ${margine_left}px`}>
      {emojis.clock} Time of parking: {return_formatted_time(input_values.parked_time, 0)}
    </p>
    <p>
      <!--<input type="checkbox" bind:checked={is_timed_parking} disabled={!edit_mode} style={`margin-left: ${margine_left}px`}>-->
      <input type="checkbox" bind:checked={is_timed_parking} on:click={() => timed_parking_change(input_values, is_timed_parking)} disabled={!edit_mode} style={`margin-left: ${margine_left}px`}>
      Timed/free hours:
      {#if is_timed_parking == true}
        <select on:change={set_timed_hours} value={input_values.timed_parking} disabled={!edit_mode}>
          {#each free_hours as free_hour}
            <option value={free_hour}>{free_hour}</option>
          {/each}
        </select>
      {:else}
        Unlimited time!
      {/if}
    </p>
    <p>
      <!--If unable to obtain gps locations show its undefined-->
      {#if /*latitude == null || longitude == null*/ input_values.gps_location == null}
        <button on:click={set_location}
        style={`background-color: ${ui_color_defs.red}; color: white; margin-left: ${margine_left}px`}>{emojis.gps} Undefined! click to refetch gps (in edit mode)</button>
      {:else}
        <button on:click={open_maps} style={`background-color: ${ui_color_defs.green}; color: white; margin-left: ${margine_left}px`}>{emojis.gps} {input_values.gps_location[1]}</button>
      {/if}
      
    </p>
    
    <!--<p><textarea placeholder="Add note..." disabled={!edit_mode} on:input={set_parking_note} style={`margin-left: ${margine_left}px`}></textarea></p>-->
    <p><textarea placeholder="Add note..." disabled={!edit_mode} bind:value={input_values.notes} style={`margin-left: ${margine_left}px`}></textarea></p>

    <!--After saving, shows what time it expires and how many hours remaining-->



    {#if edit_mode == false && is_timed_parking == true && input_values.timed_parking != null}
      <div class="show_time_stats" style={`margin-left: ${margine_left}px`}>
        <p>{emojis.clock} Due in parking time: {return_formatted_time(input_values.parked_time, input_values.timed_parking*60)}</p>
        <!--If time is critcal-->
        {#if time_remaining.mins_remaining <= notification_alerts_mins[1]}
          <p style={`color: ${ui_color_defs.red}`}>{emojis.timer} Hours remaining: {time_remaining.time_remaining_display}</p>
        <!--1 hour remaining-->
        {:else if time_remaining.mins_remaining <= notification_alerts_mins[0]}
          <p style={`color: #877a08`}>{emojis.timer} Hours remaining: {time_remaining.time_remaining_display}</p>
        <!--Plenty of time remaining-->
        {:else}
          <p style={`color: #00ce75`}>{emojis.timer} Hours remaining: {time_remaining.time_remaining_display}</p>
        {/if}
      </div>
    {/if}

    <!--Show the bottom buttons such as save, edit and delete-->
    <div class="buttom_buttons">
      {#if edit_mode == true}
        <button on:click={toggle_edit_mode} style={`background-color: ${ui_color_defs.green}`}>{emojis.save}Save details</button>
      {:else}
        <button style={`background-color: ${ui_color_defs.red}; color: white;`} on:click={() => init(true)}>{emojis.delete} Delete parking</button>
        <button style={`background-color: ${ui_color_defs.yellow}; color: black;`} on:click={toggle_edit_mode}>{emojis.edit} Edit details</button>
      {/if}
    </div>

  </div>

</main>

<style>

</style>