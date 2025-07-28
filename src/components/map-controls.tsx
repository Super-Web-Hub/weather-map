"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Layers,
  Settings,
  Info,
  Sun,
  Cloud,
  Thermometer,
  Globe,
  Zap,
  Plane,
  ChevronLeft,
  ChevronRight,
  Moon,
  Clock,
  Palette,
  Eye,
  Sliders,
  Compass,
  Plus,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Slider } from "../components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { fetchData, postData } from "../servics/apiService";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
// interface MapControlsProps {
//   position?: string;
//   mapStyle: string;
//   setMapStyle: (style: string) => void;
//   showNasaMap: boolean;
//   setShowNasaMap: (show: boolean) => void;
// }

interface City {
  name: string
  region: string
  timezone: string
}


interface MapSettings {

  showTimeZones: boolean;
  showDayNight: boolean;
  showSunMoon: boolean;
  showWeather: boolean;
  showEarthquakes: boolean;
  showAirTraffic: boolean;
  timeFormat: string;
}

interface MapControlsProps {
  timeFormat: "12h" | "24h"
  onTimeFormatChange: (format: "12h" | "24h") => void
  headerCities: City[]
  onHeaderCitiesChange: (cities: City[]) => void
}

const Section = ({
  title,
  icon: Icon,
  isChecked,
  onToggle,
}: {
  title: string;
  icon: React.ElementType;
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
}) => (
  <div className="bg-gray-800/40 rounded-lg overflow-hidden border border-gray-700/30">
    <div
      role="button"
      tabIndex={0}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-700/30 transition-colors cursor-pointer"
      aria-expanded={isChecked}
      onClick={() => onToggle(!isChecked)}
    >
      <div className="flex items-center">
        <div className="bg-indigo-900/50 p-1.5 rounded-md mr-3">
          <Icon className="h-5 w-5 text-indigo-400" />
        </div>
        <span className="font-medium">{title}</span>
      </div>
      <div className="flex items-center">
        <Switch
          checked={isChecked}
          onCheckedChange={onToggle}
          className="mr-2 data-[state=checked]:bg-indigo-600"
        />
      </div>
    </div>
  </div>
);
const MapStyleSelector = ({ mapStyle, setMapStyle }: { mapStyle: string; setMapStyle: (style: string) => void }) => {
  const styles = ["dark", "light", "satellite", "topographic", "political"];
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-300 flex items-center">
        <Palette className="h-4 w-4 mr-2 text-indigo-400" />
        Map Style
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {styles.map((style) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${mapStyle === style
              ? "bg-indigo-600/20 border-indigo-500"
              : "bg-gray-800/40 border-gray-700/30 hover:bg-gray-700/40"
              }`}
          >
            <div
              className={`w-full h-12 rounded-md mb-2 ${style === "dark"
                ? "bg-gray-900"
                : style === "light"
                  ? "bg-gray-300"
                  : style === "satellite"
                    ? "bg-blue-900"
                    : style === "topographic"
                      ? "bg-green-900"
                      : "bg-indigo-900"
                }`}
            ></div>
            <span className="text-sm capitalize">{style}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ResolutionSlider = ({
  mapResolution,
  setMapResolution,
}: {
  mapResolution: number;
  setMapResolution: (value: number) => void;
}) => (
  <div className="space-y-3">
    <h3 className="text-sm font-medium text-gray-300 flex items-center">
      <Sliders className="h-4 w-4 mr-2 text-indigo-400" />
      Map Resolution
    </h3>
    <div className="flex items-center space-x-4">
      <Slider
        value={[mapResolution]}
        min={25}
        max={100}
        step={5}
        onValueChange={(value: any) => setMapResolution(value[0])}
        className="flex-1"
      />
      <span className="text-sm w-12 text-center bg-gray-800 rounded-md py-1">{mapResolution}%</span>
    </div>
    <p className="text-xs text-gray-400">Higher resolution requires more processing power</p>
  </div>
);

const ToggleButtons = ({
  options,
  selectedOption,
  onSelect,
}: {
  options: { label: string; value: string }[];
  selectedOption: string;
  onSelect: (value: string) => void;
}) => (
  <div className="flex space-x-2">
    {options.map((option) => (
      <button
        key={option.value}
        onClick={() => onSelect(option.value)}
        className={`flex-1 py-2 px-3 rounded-md text-sm ${selectedOption === option.value
          ? "bg-indigo-600 text-white"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const availableCities: City[] = [
  { name: "London", region: "Europe", timezone: "Europe/London" },
  { name: "Paris", region: "Europe", timezone: "Europe/Paris" },
  { name: "Berlin", region: "Europe", timezone: "Europe/Berlin" },
  { name: "New York", region: "America", timezone: "America/New_York" },
  { name: "Chicago", region: "America", timezone: "America/Chicago" },
  { name: "Los Angeles", region: "America", timezone: "America/Los_Angeles" },
  { name: "Tokyo", region: "Asia", timezone: "Asia/Tokyo" },
  { name: "Beijing", region: "Asia", timezone: "Asia/Shanghai" },
  { name: "Sydney", region: "Australia", timezone: "Australia/Sydney" },
  { name: "Dubai", region: "Asia", timezone: "Asia/Dubai" },
  { name: "Moscow", region: "Europe", timezone: "Europe/Moscow" },
  { name: "Rio de Janeiro", region: "America", timezone: "America/Sao_Paulo" },
  { name: "Cairo", region: "Africa", timezone: "Africa/Cairo" },
  { name: "Johannesburg", region: "Africa", timezone: "Africa/Johannesburg" },
  { name: "Harare", region: "Africa", timezone: "Africa/Harare" },
]

interface MapControlsProps {
  showTimeFormat: "12h" | "24h";
  onToggleSunAndMoon: (show: boolean) => void;
  onTimeFormatChange: (format: "12h" | "24h") => void;
  showSunAndMoonPosition: boolean;
  showDayNightOverlay: boolean;
  setShowDayNightOverlay: (show: boolean) => void;
  showEarthQuakesData: boolean;
  onToggleEarthquakes: (show: boolean) => void;
  headerCities: City[]
  onHeaderCitiesChange: (cities: City[]) => void
}
export default function MapControls({ showTimeFormat, onTimeFormatChange, showSunAndMoonPosition, onToggleSunAndMoon, showDayNightOverlay, setShowDayNightOverlay, showEarthQuakesData, onToggleEarthquakes, headerCities,
  onHeaderCitiesChange, }: MapControlsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("layers");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedSettings, setLastSavedSettings] = useState<MapSettings | null>(null);

  // Track if component is mounted
  const isMounted = useRef(true);

  // Map settings
  const [mapResolution, setMapResolution] = useState(75);
  const [timeFormat, setTimeFormat] = useState("24h");
  const [showTimeZones, setShowTimeZones] = useState(true);
  const [showDayNight, setShowDayNight] = useState(false);
  const [showSunMoon, setShowSunMoon] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [showEarthquakes, setShowEarthquakes] = useState(false);
  const [showAirTraffic, setShowAirTraffic] = useState(false);
  const [expandedSection, setExpandedSection] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false)
  const [tempUnit, setTempUnit] = useState("celsius")
  const [dateStyleOpen, setDateStyleOpen] = useState(false)
  const [selectedDateStyle, setSelectedDateStyle] = useState("7 January, 2018")

  const dateStyleOptions = ["7 January, 2018", "January 7, 2018", "2018 January 7", "Sunday, January 7, 2018"]

  const sectionVariants = {
    collapsed: { height: 0, opacity: 0, overflow: "hidden" },
    expanded: { height: "auto", opacity: 1, overflow: "visible" },
  }
  const dropdownVariants = {
    hidden: { opacity: 0, height: 0, overflow: "hidden" },
    visible: { opacity: 1, height: "auto", overflow: "visible" },
  }
  // Helper function to get current user ID
  const getCurrentUserId = useCallback((): string | null => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
      const decoded = jwtDecode<{ id: string }>(token);
      return decoded?.id;
    } catch (error) {
      console.error("Error decoding JWT token:", error);
      return null;
    }
  }, []);

  // Collect current settings
  const getCurrentSettings = useCallback((): MapSettings => {
    return {
      timeFormat,
      showTimeZones,
      showDayNight,
      showSunMoon,
      showWeather,
      showEarthquakes,
      showAirTraffic
    };
  }, [
    timeFormat,
    showTimeZones,
    showDayNight,
    showSunMoon,
    showWeather,
    showEarthquakes,
    showAirTraffic
  ]);

  // Check if settings have changed
  useEffect(() => {
    if (!lastSavedSettings) return;

    const currentSettings = getCurrentSettings();
    const settingsChanged = JSON.stringify(currentSettings) !== JSON.stringify(lastSavedSettings);

    setHasUnsavedChanges(settingsChanged);
  }, [
    getCurrentSettings,
    lastSavedSettings,
    mapResolution,
    timeFormat,
    showTimeZones,
    showDayNight,
    showSunMoon,
    showWeather,
    showEarthquakes,
    showAirTraffic
  ]);

  // Fetch settings from backend on component mount
  // useEffect(() => {
  //   const fetchMapSettings = async () => {
  //     const userId = getCurrentUserId();
  //     if (!userId) {
  //       setIsLoading(false);
  //       return; // Use default settings for non-logged in users
  //     }

  //     try {

  //     } catch (error) {
  //       console.error("Error fetching map settings:", error);
  //       setIsLoading(false);
  //       // Continue with default settings
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchMapSettings();

  //   // Set isMounted to false when component unmounts
  //   return () => {
  //     isMounted.current = false;
  //   };
  // }, [getCurrentUserId]);

  // Save settings to backend
  const saveSettingsToBackend = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log("User not logged in, settings not saved");
      return false;
    }

    if (!hasUnsavedChanges) {
      console.log("No changes to save");
      return true; // No need to save if nothing changed
    }

    setIsSaving(true);

    // Collect all settings
    const settings = getCurrentSettings();

    try {
      const response = await postData(`/map-settings/${userId}`, settings);
      console.log("Map settings saved to server:", response);

      // Update last saved settings
      if (isMounted.current) {
        setLastSavedSettings(settings);
        setHasUnsavedChanges(false);
      }

      // Dispatch event for other components to react to settings changes
      const event = new CustomEvent('mapSettingsChanged', {
        detail: { type: 'SETTINGS_SAVED', settings }
      });
      window.dispatchEvent(event);

      return true;
    } catch (error) {
      console.error("Error saving map settings:", error);
      if (isMounted.current) {
        toast.error("Failed to save settings");
      }
      return false;
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  };

  // Handle closing the panel
  const handleClosePanel = async () => {
    // If there are unsaved changes, save them before closing
    if (hasUnsavedChanges) {
      setIsSaving(true);
      const success = await saveSettingsToBackend();
      if (success) {
        toast.success("Settings saved");
      }
    }

    // Close the panel
    setIsOpen(false);
  };

  // Save settings when component unmounts if there are unsaved changes
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges) {
        saveSettingsToBackend();
      }
    };
  }, [hasUnsavedChanges]);


  const updateShowTimeZones = (show: boolean) => {
    setShowTimeZones(show);
  };

  const updateShowDayNight = (show: boolean) => {
    setShowDayNight(show);
    setShowDayNightOverlay(show)
  };

  const updateShowSunMoon = (show: boolean) => {
    onToggleSunAndMoon(show);
  };

  const updateShowWeather = (show: boolean) => {
    setShowWeather(show);
  };

  const updateShowEarthquakes = (show: boolean) => {
    console.log("EarthQuakes Data on Map Control", show)
    onToggleEarthquakes(show)
  };

  const updateShowAirTraffic = (show: boolean) => {
    setShowAirTraffic(show);
  };

  const updateMapResolution = (value: number) => {
    setMapResolution(value);
  };

  const updateTimeFormat = (format: string) => {
    setTimeFormat(format);
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: -320, opacity: 0 },
  };
  const sections = useMemo(
    () => [
      {
        title: "Time Zones",
        icon: Clock,
        isChecked: showTimeZones,
        onToggle: updateShowTimeZones,
      },
      // {
      //   title: "Day/Night",
      //   icon: Sun,
      //   isChecked: showDayNightOverlay,
      //   onToggle: updateShowDayNight,
      // },
      {
        title: "Sun & Moon",
        icon: Moon,
        isChecked: showSunAndMoonPosition,
        onToggle: updateShowSunMoon,
      },
    ],
    [showTimeZones, showDayNightOverlay, showSunAndMoonPosition]
  );

  // Show loading state
  // if (isLoading) {
  //   return (
  //     <div className="absolute left-0 top-0 h-full z-20">
  //       <div className="bg-gray-900/95 backdrop-blur-md border-r border-gray-800/50 text-white h-full w-80 shadow-xl flex flex-col items-center justify-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
  //         <p className="text-gray-300">Loading settings...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (!isOpen) {
    return (
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute top-10 left-0 z-20"
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 text-white hover:bg-gray-700 shadow-lg flex items-center gap-2 pl-2 pr-3 rounded-r-full rounded-l-none h-12"
        >
          <ChevronLeft className="h-5 w-5 text-indigo-400" />
          <span>Controls</span>
        </Button>
      </motion.div>
    );
  }

  const toggleSection = () => {
    setExpandedSection(prev => !prev)
  }

  // Format current time for a timezone
  const formatCityTime = (timezone: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "numeric",
        hour12: timeFormat === "12h",
        timeZone: timezone,
      }

      return new Date().toLocaleTimeString("en-US", options)
    } catch (error) {
      return "--:--"
    }
  }

  const removeCity = (cityToRemove: City) => {
    const updatedCities = headerCities.filter((city) => city.name !== cityToRemove.name)
    onHeaderCitiesChange(updatedCities)
  }


  const addCity = (cityToAdd: City) => {
    // Check if city already exists
    if (!headerCities.some((city) => city.name === cityToAdd.name)) {
      const updatedCities = [...headerCities, cityToAdd]
      onHeaderCitiesChange(updatedCities)
    }
    setShowAddCityModal(false)
  }

  return (
    <TooltipProvider>
      <motion.div
        initial="closed"
        animate="open"
        variants={sidebarVariants}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="absolute left-0 top-0 h-full z-20 w-[350px]"
      >
        <div className="bg-gray-900/95 backdrop-blur-md border-r border-gray-800/50 text-white h-full shadow-xl flex flex-col overflow-auto">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Map Controls
            </h2>
            <div className="flex items-center space-x-2">
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClosePanel}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50"
                disabled={isSaving}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
          {/* Tabs */}
          <Tabs defaultValue="layers" onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 p-1 m-4 bg-gray-800/70 rounded-lg">
              <TabsTrigger
                value="layers"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md"
              >
                <Layers className="h-4 w-4 mr-2" />
                Layers
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md"
              >
                <Info className="h-4 w-4 mr-2" />
                Info
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
              <TabsContent value="layers" className="mt-0 h-full">
                <div className="space-y-4">
                  {sections.map((section) => (
                    <Section
                      key={section.title}
                      title={section.title}
                      icon={section.icon}
                      isChecked={section.isChecked}
                      onToggle={section.onToggle}
                    />
                  ))}
                  <div className="bg-gray-800/40 rounded-lg overflow-hidden border border-gray-700/30">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleSection()}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-700/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="bg-purple-900/50 p-1.5 rounded-md mr-3">
                          <Sun className="h-5 w-5 text-amber-400" />
                        </div>
                        <span className="font-medium">Day/Night</span>
                      </div>
                      <div className="flex items-center">
                        <Switch
                          checked={showDayNight}
                          onCheckedChange={updateShowDayNight}
                          className="mr-2 data-[state=checked]:bg-indigo-600"
                        />
                      </div>
                    </div>

                    <motion.div
                      variants={sectionVariants}
                      initial="collapsed"
                      animate={expandedSection === true ? "expanded" : "collapsed"}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-3 pt-0 space-y-4 border-t border-gray-700/30">
                        {/* Current date and time display */}

                        {/* Date slider */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-300">Date</label>
                            <span className="text-xs text-gray-400">July 22, 2014</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Slider defaultValue={[50]} max={100} step={1} className="flex-1" />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Jan 1</span>
                            <span>Dec 31</span>
                          </div>
                        </div>

                        {/* Time slider */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-300">Time</label>
                            <span className="text-xs text-gray-400">5:24 AM</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Slider defaultValue={[22]} max={100} step={1} className="flex-1" />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>12:00 AM</span>
                            <span>11:59 PM</span>
                          </div>
                        </div>

                        {/* Display options */}
                        {/* <div className="pt-2 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-300">Show terminator line</label>
                            <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-300">Realistic shading</label>
                            <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Shadow intensity</label>
                            <Slider defaultValue={[60]} max={100} step={5} className="py-1" />
                          </div>
                        </div> */}


                      </div>
                    </motion.div>
                  </div>
                  {/* Premium Features */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-300">Premium Features</h3>
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">PRO</Badge>
                    </div>

                    <div className="bg-gray-800/40 rounded-lg overflow-hidden border border-gray-700/30 opacity-80">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center">
                          <div className="bg-blue-900/50 p-1.5 rounded-md mr-3">
                            <Cloud className="h-5 w-5 text-blue-400" />
                          </div>
                          <span className="font-medium">Weather</span>
                        </div>
                        <div className="flex items-center">
                          <Switch
                            checked={showWeather}
                            onCheckedChange={setShowWeather}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/40 rounded-lg overflow-hidden border border-gray-700/30 opacity-80">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center">
                          <div className="bg-amber-900/50 p-1.5 rounded-md mr-3">
                            <Zap className="h-5 w-5 text-amber-400" />
                          </div>
                          <span className="font-medium">Earthquakes</span>
                        </div>
                        <div className="flex items-center">
                          <Switch
                            checked={showEarthQuakesData}
                            onCheckedChange={updateShowEarthquakes}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/40 rounded-lg overflow-hidden border border-gray-700/30 opacity-80">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center">
                          <div className="bg-sky-900/50 p-1.5 rounded-md mr-3">
                            <Plane className="h-5 w-5 text-sky-400" />
                          </div>
                          <span className="font-medium">Air Traffic</span>
                        </div>
                        <div className="flex items-center">
                          <Switch
                            checked={showAirTraffic}
                            onCheckedChange={setShowAirTraffic}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg border border-indigo-800/50">
                      <p className="text-sm">
                        Unlock premium features with a subscription.
                        <Button variant="link" className="text-indigo-400 p-0 h-auto text-sm ml-1">
                          Upgrade now
                        </Button>
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="settings" className="mt-0 h-full">
                <div className="space-y-6">
                  {/* <MapStyleSelector/> */}
                  {/* <ResolutionSlider mapResolution={mapResolution} setMapResolution={setMapResolution} /> */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-300 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                      Time Format
                    </h3>
                    <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30 space-y-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onTimeFormatChange("24h")}
                          className={`flex-1 py-2 px-3 rounded-md text-sm ${showTimeFormat === "24h"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                        >
                          24-hour
                        </button>
                        <button
                          onClick={() => onTimeFormatChange("12h")}
                          className={`flex-1 py-2 px-3 rounded-md text-sm ${showTimeFormat === "12h"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                        >
                          12-hour (AM/PM)
                        </button>
                      </div>
                      {/* Date style */}
                      <div className="relative space-y-2">
                        <label className="text-sm text-gray-300">Date style</label>

                        <button
                          onClick={() => setDateStyleOpen(!dateStyleOpen)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-sm text-white flex justify-between items-center"
                        >
                          <span>{selectedDateStyle}</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${dateStyleOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        <AnimatePresence>
                          {dateStyleOpen && (
                            <motion.div
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              variants={dropdownVariants}
                              transition={{ duration: 0.2 }}
                              className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg"
                            >
                              {dateStyleOptions.map((option) => (
                                <button
                                  key={option}
                                  className={`w-full text-left p-2 text-sm hover:bg-gray-700 flex justify-between items-center {selectedDateStyle === option ? "bg-gray-700/50 text-white" : "text-gray-300"
                                    }`}
                                  onClick={() => {
                                    setSelectedDateStyle(option)
                                    setDateStyleOpen(false)
                                  }}
                                >
                                  {option}
                                  {selectedDateStyle === option && <Check className="h-4 w-4 text-indigo-400" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Date separators */}
                      <div className="space-y-2">
                        <label className="text-sm text-gray-300">Date separators</label>
                        <div className="space-y-2">
                          {[
                            { id: "slash", label: "M/D/YYYY" },
                            { id: "dash", label: "M-D-YYYY" },
                            { id: "dot", label: "M.D.YYYY" },
                          ].map((separator) => (
                            <div key={separator.id} className="flex items-center">
                              <input
                                type="radio"
                                id={`separator-${separator.id}`}
                                name="date-separator"
                                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 bg-gray-800"
                                defaultChecked={separator.id === "slash"}
                              />
                              <label htmlFor={`separator-${separator.id}`} className="text-sm text-gray-300">
                                {separator.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Date format */}
                      <div className="space-y-2">
                        <label className="text-sm text-gray-300">Date format</label>
                        <div className="space-y-2">
                          {[
                            { id: "mdy", label: "M/D/YYYY" },
                            { id: "dmy", label: "D/M/YYYY" },
                            { id: "ymd", label: "YYYY/M/D" },
                            { id: "ydm", label: "YYYY/D/M" },
                          ].map((format) => (
                            <div key={format.id} className="flex items-center">
                              <input
                                type="radio"
                                id={`format-${format.id}`}
                                name="date-format"
                                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 bg-gray-800"
                                defaultChecked={format.id === "mdy"}
                              />
                              <label htmlFor={`format-${format.id}`} className="text-sm text-gray-300">
                                {format.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 pt-1">
                        These settings affect all date and time displays throughout the application.
                      </div>
                    </div>
                  </div>
                  {/* WorldWide Clock */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-300 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                      Header Clocks
                    </h3>
                    <div className="space-y-3 bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-300">Manage Header Clocks</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full bg-green-600 hover:bg-green-700"
                          onClick={() => setShowAddCityModal(true)}
                        >
                          <Plus className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">{headerCities.length} clocks displayed in header</div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {headerCities.map((city) => (
                          <div
                            key={city.name}
                            className="bg-gray-800/50 rounded-md p-2 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium text-white">{city.name}</div>
                              <div className="text-xs text-gray-400">{city.region}</div>
                              {/* <div className="text-xs text-gray-400">{city.region}</div> */}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-white">{formatCityTime(city.timezone)}</div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-red-500/80 hover:bg-red-600"
                                onClick={() => removeCity(city)}
                              >
                                <X className="h-3 w-3 text-white" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-xs text-gray-400 pt-1">
                        These clocks will be displayed in the header bar at the top of the map view.
                      </div>
                    </div>
                  </div>
                  {/* Temperature Unit */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-300 flex items-center">
                      <Thermometer className="h-4 w-4 mr-2 text-indigo-400" />
                      Temperature Unit
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setTempUnit("celsius")}
                        className={`flex-1 py-2 px-3 rounded-md text-sm ${tempUnit === "celsius"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          }`}
                      >
                        Celsius (°C)
                      </button>
                      <button
                        onClick={() => setTempUnit("fahrenheit")}
                        className={`flex-1 py-2 px-3 rounded-md text-sm ${tempUnit === "fahrenheit"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          }`}
                      >
                        Fahrenheit (°F)
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="info" className="mt-0 h-full">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      World Time Map provides real-time visualization of time zones, weather patterns, and other global
                      data.
                    </p>

                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-4 rounded-lg border border-indigo-800/30">
                      <h3 className="font-medium flex items-center text-indigo-300">
                        <Globe className="h-5 w-5 mr-2 text-indigo-400" />
                        About This Project
                      </h3>
                      <p className="text-sm mt-2 text-gray-300">
                        This interactive world map allows you to explore time zones, track day/night cycles, and monitor
                        celestial positions in real-time. Premium features include weather data, earthquake tracking,
                        and more.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-300">Feature Highlights</h3>

                    <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                      <h4 className="font-medium flex items-center text-amber-300">
                        <Sun className="h-4 w-4 mr-2 text-amber-400" />
                        Sun & Moon Tracking
                      </h4>
                      <p className="text-xs mt-1 text-gray-300">
                        Track the real-time positions of the Sun and Moon across the globe. View sunrise and sunset
                        times for any location.
                      </p>
                    </div>

                    <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                      <h4 className="font-medium flex items-center text-blue-300">
                        <Cloud className="h-4 w-4 mr-2 text-blue-400" />
                        Weather Data
                      </h4>
                      <p className="text-xs mt-1 text-gray-300">
                        Premium feature: Access real-time weather data including temperature, precipitation, and cloud
                        cover from trusted sources.
                      </p>
                      <Badge className="mt-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                        PREMIUM
                      </Badge>
                    </div>

                    <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                      <h4 className="font-medium flex items-center text-emerald-300">
                        <Compass className="h-4 w-4 mr-2 text-emerald-400" />
                        High-Resolution Maps
                      </h4>
                      <p className="text-xs mt-1 text-gray-300">
                        Experience crystal clear maps with support for ultra-high resolution displays and multiple map
                        styles.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-whit  e border-0"
                    >
                      Upgrade to Premium
                    </Button>
                  </div>

                  <div className="pt-4 text-center text-xs text-gray-500">
                    <p>
                      Version: 1.0
                      <br />© 2025 World Time Map
                    </p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </motion.div>
      {/* Add City Modal */}
      {showAddCityModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddCityModal(false)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Add City Clock</h3>
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {availableCities
                .filter((city) => !headerCities.some((c) => c.name === city.name))
                .map((city) => (
                  <button
                    key={city.name}
                    onClick={() => addCity(city)}
                    className="flex justify-between items-center w-full p-3 mb-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left"
                  >
                    <div>
                      <div className="text-white font-medium">{city.name}</div>
                      <div className="text-gray-400 text-sm">{city.region}</div>
                    </div>
                    <div className="text-gray-300">{formatCityTime(city.timezone)}</div>
                  </button>
                ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddCityModal(false)}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
